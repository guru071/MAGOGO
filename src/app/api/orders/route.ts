import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { getFeeConfig, calculateFees } from '@/lib/fees';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const type = new URL(req.url).searchParams.get('type') || 'bought';
    const where = type === 'sold' ? { sellerId: user.id! } : { buyerId: user.id! };
    const orders = await db.order.findMany({ where, include: { prompt: { select: { id: true, title: true, sampleImages: true, price: true, isFree: true } }, buyer: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: orders });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { promptId, paymentMethod, couponCode, currency } = await req.json();
    
    // Validate payment method
    const validMethods = ['WALLET'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: `Invalid direct payment method. Must be one of: ${validMethods.join(', ')}. Use dedicated checkout routes for external gateways.` }, { status: 400 });
    }
    
    const prompt = await db.prompt.findUnique({ 
      where: { id: promptId },
      include: { category: true }
    });
    if (!prompt || prompt.status !== 'APPROVED') return NextResponse.json({ success: false, error: 'Prompt not available' }, { status: 404 });
    if (prompt.sellerId === user.id!) return NextResponse.json({ success: false, error: 'Cannot buy own prompt' }, { status: 400 });
    const existing = await db.order.findFirst({ where: { buyerId: user.id!, promptId, status: 'COMPLETED' } });
    if (existing) return NextResponse.json({ success: false, error: 'Already purchased' }, { status: 400 });
    const feeConfig = await getFeeConfig();

    const orderResult = await db.$transaction(async (tx) => {
      // Re-fetch user inside transaction for balance check
      const txUser = await tx.user.findUnique({ where: { id: user.id! } });
      let amount = prompt.isFree ? 0 : prompt.price;
      let discountAmt = 0;
      
      if (couponCode && amount > 0) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || coupon.expiresAt > new Date()) && amount >= coupon.minAmount) {
          discountAmt = amount * coupon.discount / 100;
          amount -= discountAmt;
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }

      if (amount > 0 && (!txUser || txUser.currentBalance < amount)) {
        return { error: 'Insufficient wallet balance' };
      }
      
      const feeBreakdown = calculateFees(amount, feeConfig, prompt.promptText.length, prompt.category.name);

      const order = await tx.order.create({
        data: {
          orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`,
          buyerId: user.id!,
          promptId,
          sellerId: prompt.sellerId,
          amount,
          platformFee: feeBreakdown.totalFees,
          sellerAmount: feeBreakdown.netAmount,
          commissionRate: feeBreakdown.commissionRate,
          commissionAmt: feeBreakdown.commissionAmt,
          gstRate: feeBreakdown.gstRate,
          gstAmt: feeBreakdown.gstAmt,
          closingFee: feeBreakdown.closingFee,
          paymentFeeRate: feeBreakdown.paymentFeeRate,
          paymentFeeAmt: feeBreakdown.paymentFeeAmt,
          totalFees: feeBreakdown.totalFees,
          netAmount: feeBreakdown.netAmount,
          paymentMethod: paymentMethod || 'WALLET',
          currency: currency || 'USD',
          status: 'COMPLETED',
          couponCode: couponCode || null,
        }
      });

      // Create platform revenue record
      await tx.platformRevenue.create({
        data: {
          orderId: order.id,
          commission: feeBreakdown.commissionAmt,
          gst: feeBreakdown.gstAmt,
          closingFee: feeBreakdown.closingFee,
          paymentFee: feeBreakdown.paymentFeeAmt,
          total: feeBreakdown.totalFees,
          currency: currency || 'USD',
        }
      });

      await tx.prompt.update({ where: { id: promptId }, data: { downloadCount: { increment: 1 } } });
      
      await tx.user.update({ 
        where: { id: prompt.sellerId }, 
        data: { 
          totalEarnings: { increment: feeBreakdown.netAmount }, 
          currentBalance: { increment: feeBreakdown.netAmount } 
        } 
      });
      
      // CRITICAL SECURITY FIX: Deduct from buyer's currentBalance
      await tx.user.update({ 
        where: { id: user.id! }, 
        data: { 
          totalSpent: { increment: amount },
          currentBalance: { decrement: amount }
        } 
      });

      // Create wallet transaction records
      if (amount > 0) {
        await tx.walletTransaction.create({
          data: {
            userId: user.id!,
            amount: amount,
            type: 'DEBIT',
            description: `Payment for Order ${order.orderId}`,
            status: 'COMPLETED'
          }
        });
        await tx.walletTransaction.create({
          data: {
            userId: prompt.sellerId,
            amount: feeBreakdown.netAmount,
            type: 'CREDIT',
            description: `Earnings from Order ${order.orderId}`,
            status: 'COMPLETED'
          }
        });
      }
      
      await tx.notification.create({ 
        data: { 
          userId: prompt.sellerId, 
          title: 'New Sale!', 
          message: `Your prompt "${prompt.title}" was purchased for $${amount.toFixed(2)} (net: $${feeBreakdown.netAmount.toFixed(2)} after fees)`, 
          type: 'ORDER' 
        } 
      });

      return { order: await tx.order.findUnique({ where: { id: order.id }, include: { prompt: true, revenue: true } }) };
    });

    if (orderResult.error) {
      return NextResponse.json({ success: false, error: orderResult.error }, { status: 400 });
    }
    const result = orderResult.order;
    
    // Send Receipt Email
    import('@/lib/email').then(({ sendReceiptEmail }) => {
      sendReceiptEmail(user.email || '', prompt.title, result!.amount).catch(e => console.error('[email] receipt failed', e));
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
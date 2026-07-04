import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/ai-client';
import { getFeeConfig, calculateFees, FeeBreakdown } from '@/lib/fees';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const type = new URL(req.url).searchParams.get('type') || 'bought';
    const where = type === 'sold' ? { sellerId: user.id! } : { buyerId: user.id! };
    const orders = await db.order.findMany({ where, include: { prompt: { select: { id: true, title: true, sampleImages: true, price: true, isFree: true } }, buyer: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: orders });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { promptId, paymentMethod, couponCode, currency } = await req.json();
    
    // Validate payment method
    const validMethods = ['WALLET', 'STRIPE', 'RAZORPAY', 'PAYPAL', 'PLAY_STORE', 'FIAT'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` }, { status: 400 });
    }
    
    const prompt = await db.prompt.findUnique({ 
      where: { id: promptId },
      include: { category: true }
    });
    if (!prompt || prompt.status !== 'APPROVED') return NextResponse.json({ success: false, error: 'Prompt not available' }, { status: 404 });
    if (prompt.sellerId === user.id!) return NextResponse.json({ success: false, error: 'Cannot buy own prompt' }, { status: 400 });
    const existing = await db.order.findFirst({ where: { buyerId: user.id!, promptId, status: 'COMPLETED' } });
    if (existing) return NextResponse.json({ success: false, error: 'Already purchased' }, { status: 400 });
    let amount = prompt.isFree ? 0 : prompt.price;
    let discountAmt = 0;
    if (couponCode && amount > 0) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || coupon.expiresAt > new Date()) && amount >= coupon.minAmount) {
        discountAmt = amount * coupon.discount / 100;
        amount -= discountAmt;
        await db.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }
    if (amount > 0 && (user.currentBalance || 0) < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // AI payment risk scoring (non-blocking — log only)
    const seller = await db.user.findUnique({ where: { id: prompt.sellerId }, select: { totalEarnings: true, isVerified: true } });
    ai.payment.riskScore({
      userId: user.id!,
      email: user.email,
      amount,
      promptId,
      paymentMethod: paymentMethod || 'WALLET',
      sellerId: prompt.sellerId,
      currency: currency || 'USD',
      userCreatedAt: user.createdAt,
      userTotalSpent: user.totalSpent || 0,
      sellerTotalEarnings: seller?.totalEarnings || 0,
      sellerIsVerified: seller?.isVerified || false,
    }).catch(e => { console.error('[orders] payment risk scoring error', e); });

    // Fee configuration - No fees on sale, 100% goes to seller
    const feeBreakdown: FeeBreakdown = {
      grossAmount: amount,
      commissionRate: 0, commissionAmt: 0,
      gstRate: 0, gstAmt: 0,
      closingFee: 0,
      paymentFeeRate: 0, paymentFeeAmt: 0,
      totalFees: 0, netAmount: amount,
    }

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
          buyerId: user.id!,
          promptId,
          sellerId: prompt.sellerId,
          amount,
          platformFee: 0,
          sellerAmount: amount,
          commissionRate: 0,
          commissionAmt: 0,
          gstRate: 0,
          gstAmt: 0,
          closingFee: 0,
          paymentFeeRate: 0,
          paymentFeeAmt: 0,
          totalFees: 0,
          netAmount: amount,
          paymentMethod: paymentMethod || 'WALLET',
          currency: currency || 'USD',
          status: 'COMPLETED',
          couponCode: couponCode || null,
        }
      })

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
      })

      await tx.prompt.update({ where: { id: promptId }, data: { downloadCount: { increment: 1 } } })
      
      await tx.user.update({ 
        where: { id: prompt.sellerId }, 
        data: { 
          totalEarnings: { increment: feeBreakdown.netAmount }, 
          currentBalance: { increment: feeBreakdown.netAmount } 
        } 
      })
      
      // CRITICAL SECURITY FIX: Deduct from buyer's currentBalance
      await tx.user.update({ 
        where: { id: user.id! }, 
        data: { 
          totalSpent: { increment: amount },
          currentBalance: { decrement: amount }
        } 
      })
      
      await tx.notification.create({ 
        data: { 
          userId: prompt.sellerId, 
          title: 'New Sale!', 
          message: `Your prompt "${prompt.title}" was purchased for $${amount.toFixed(2)} (net: $${feeBreakdown.netAmount.toFixed(2)} after fees)`, 
          type: 'ORDER' 
        } 
      })

      return tx.order.findUnique({ where: { id: order.id }, include: { prompt: true, revenue: true } })
    });
    
    // Send Receipt Email
    import('@/lib/email').then(({ sendReceiptEmail }) => {
      sendReceiptEmail(user.email || '', prompt.title, amount).catch(e => console.error('[email] receipt failed', e));
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
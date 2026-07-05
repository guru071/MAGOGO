import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/razorpay';
import { getFeeConfig, calculateFees } from '@/lib/fees';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, promptIds, couponCode, currency } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing Razorpay payment details' }, { status: 400 });
    }
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No prompts provided' }, { status: 400 });
    }

    // Verify Signature
    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    const feeConfig = await getFeeConfig();
    const processedOrders: any[] = [];

    // Process orders inside a transaction
    const result = await db.$transaction(async (tx) => {
      let totalAmountPaid = 0;

      for (const promptId of promptIds) {
        const prompt = await tx.prompt.findUnique({ 
          where: { id: promptId },
          include: { category: true }
        });
        
        if (!prompt || prompt.status !== 'APPROVED') continue;
        if (prompt.sellerId === user.id) continue;

        const existing = await tx.order.findFirst({ where: { buyerId: user.id, promptId, status: 'COMPLETED' } });
        if (existing) continue;

        let amount = prompt.isFree ? 0 : prompt.price;
        
        if (couponCode && amount > 0) {
          const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
          if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || coupon.expiresAt > new Date()) && amount >= coupon.minAmount) {
            const discountAmt = amount * coupon.discount / 100;
            amount -= discountAmt;
            await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
          }
        }

        totalAmountPaid += amount;

        const feeBreakdown = calculateFees(amount, feeConfig, prompt.promptText.length, prompt.category?.name);

        const order = await tx.order.create({
          data: {
            orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
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
            paymentMethod: 'RAZORPAY',
            paymentId: razorpayPaymentId,
            currency: currency || 'USD',
            status: 'COMPLETED',
            couponCode: couponCode || null,
          },
          include: { prompt: true, revenue: true }
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
        
        // Credit the seller
        await tx.user.update({ 
          where: { id: prompt.sellerId }, 
          data: { 
            totalEarnings: { increment: feeBreakdown.netAmount }, 
            currentBalance: { increment: feeBreakdown.netAmount } 
          } 
        });
        
        // ONLY increment totalSpent for buyer, do NOT decrement currentBalance because they paid via external gateway.
        await tx.user.update({ 
          where: { id: user.id! }, 
          data: { 
            totalSpent: { increment: amount }
          } 
        });

        if (amount > 0) {
          // Record Direct External Payment for the buyer
          await tx.walletTransaction.create({
            data: {
              userId: user.id!,
              amount: amount,
              type: 'DEBIT',
              description: `Direct Payment for Order ${order.orderId} via Razorpay`,
              status: 'COMPLETED'
            }
          });
          // Record Credit for the seller
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

        processedOrders.push(order);
      }
      return processedOrders;
    });

    if (result.length > 0) {
      import('@/lib/email').then(({ sendReceiptEmail }) => {
        for (const o of result) {
          sendReceiptEmail(user.email || '', o.prompt.title, o.amount).catch(e => console.error('[email] receipt failed', e));
        }
      });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e: any) { 
    console.error('[checkout/verify]', e);
    return NextResponse.json({ success: false, error: e.message || 'Verification failed' }, { status: 500 }); 
  }
}

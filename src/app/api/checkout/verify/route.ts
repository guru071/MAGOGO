import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing Razorpay payment details' }, { status: 400 });
    }

    // Verify Signature
    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    const processedOrders: any[] = [];

    // Process orders inside a transaction
    const result = await db.$transaction(async (tx) => {
      
      // CRITICAL SECURITY FIX: Fetch PENDING orders created during the checkout initialization
      // We explicitly ignore any prompt IDs sent from the frontend to prevent ID swapping.
      const pendingOrders = await tx.order.findMany({
        where: {
          buyerId: user.id!,
          paymentId: razorpayOrderId,
          status: 'PENDING'
        },
        include: { prompt: true }
      });

      if (pendingOrders.length === 0) {
        throw new Error('No pending orders found for this payment');
      }

      let totalAmountPaid = 0;

      for (const order of pendingOrders) {
        // If the coupon was used, increment its count
        if (order.couponCode) {
          const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode.toUpperCase() } });
          if (coupon) {
            await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
          }
        }

        totalAmountPaid += order.amount;

        // Mark as completed
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            paymentId: razorpayPaymentId,
          },
          include: { prompt: true, revenue: true }
        });

        // Create platform revenue record
        await tx.platformRevenue.create({
          data: {
            orderId: updatedOrder.id,
            commission: updatedOrder.commissionAmt || 0,
            gst: updatedOrder.gstAmt || 0,
            closingFee: updatedOrder.closingFee || 0,
            paymentFee: updatedOrder.paymentFeeAmt || 0,
            total: updatedOrder.totalFees || 0,
            currency: updatedOrder.currency || 'USD',
          }
        });

        await tx.prompt.update({ where: { id: order.promptId }, data: { downloadCount: { increment: 1 } } });
        
        // Credit the seller
        await tx.user.update({ 
          where: { id: order.sellerId }, 
          data: { 
            totalEarnings: { increment: updatedOrder.sellerAmount }, 
            currentBalance: { increment: updatedOrder.sellerAmount } 
          } 
        });
        
        // ONLY increment totalSpent for buyer, do NOT decrement currentBalance because they paid via external gateway.
        await tx.user.update({ 
          where: { id: user.id! }, 
          data: { 
            totalSpent: { increment: order.amount }
          } 
        });

        if (order.amount > 0) {
          // Record Direct External Payment for the buyer
          await tx.walletTransaction.create({
            data: {
              userId: user.id!,
              amount: order.amount,
              type: 'DEBIT',
              description: `Direct Payment for Order ${updatedOrder.orderId} via Razorpay`,
              status: 'COMPLETED'
            }
          });
          // Record Credit for the seller
          await tx.walletTransaction.create({
            data: {
              userId: order.sellerId,
              amount: updatedOrder.sellerAmount,
              type: 'CREDIT',
              description: `Earnings from Order ${updatedOrder.orderId}`,
              status: 'COMPLETED'
            }
          });
        }
        
        await tx.notification.create({ 
          data: { 
            userId: order.sellerId, 
            title: 'New Sale!', 
            message: `Your prompt "${order.prompt.title}" was purchased for $${order.amount.toFixed(2)} (net: $${updatedOrder.sellerAmount.toFixed(2)} after fees)`, 
            type: 'ORDER' 
          } 
        });

        processedOrders.push(updatedOrder);
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

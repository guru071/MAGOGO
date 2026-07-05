import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { buyer: { select: { name: true, email: true, currentBalance: true } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'REFUNDED') {
      return NextResponse.json({ success: false, error: 'Order already refunded' }, { status: 400 });
    }

    // Check if Razorpay is configured
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    const { usdToPaise } = await import('@/lib/razorpay');

    let refundId: string | null = null;
    let paymentRefund = false;

    if (razorpayKeyId && razorpaySecret && order.paymentId) {
      // Attempt real Razorpay refund
      try {
        const basicAuth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');

        const refundRes = await fetch('https://api.razorpay.com/v1/payments/' + order.paymentId + '/refund', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: usdToPaise(order.amount), // Fixed currency conversion
            notes: { reason: reason || 'Admin initiated refund' },
          }),
        });

        if (refundRes.ok) {
          const refundData = await refundRes.json();
          refundId = refundData.id;
          paymentRefund = true;
        }
      } catch (e) {
        console.error('[razorpay/refund] payment gateway refund failed', e);
        // Payment gateway refund failed, will do manual refund
      }
    }

    // Process refund atomically
    await db.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });

      // Credit buyer's balance (manual refund fallback)
      if (!paymentRefund) {
        await tx.user.update({
          where: { id: order.buyerId },
          data: { currentBalance: { increment: order.amount } },
        });
        
        await tx.walletTransaction.create({
          data: {
            userId: order.buyerId,
            amount: order.amount,
            type: 'CREDIT',
            description: `Refund for Order ${order.orderId}`,
            status: 'COMPLETED'
          }
        });
      }

      // CRITICAL FIX: Reverse seller earnings
      await tx.user.update({
        where: { id: order.sellerId },
        data: {
          currentBalance: { decrement: order.sellerAmount },
          totalEarnings: { decrement: order.sellerAmount }
        }
      });
      
      await tx.walletTransaction.create({
        data: {
          userId: order.sellerId,
          amount: order.sellerAmount,
          type: 'DEBIT',
          description: `Reversal for Refunded Order ${order.orderId}`,
          status: 'COMPLETED'
        }
      });

      // Log the activity
      await tx.activityLog.create({
        data: {
          userId: user.id!,
          action: 'ORDER_REFUNDED',
          details: `Refunded order ${order.orderId} for $${order.amount.toFixed(2)} (Buyer: ${order.buyer.name}). Reason: ${reason || 'No reason provided'}. ${refundId ? `Razorpay refund ID: ${refundId}` : 'Manual balance credit.'}`,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: order.amount,
        refundId,
        method: paymentRefund ? 'razorpay' : 'balance_credit',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
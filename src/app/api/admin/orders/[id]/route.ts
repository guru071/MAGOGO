import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'FAILED', 'CANCELLED'];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const existingOrder = await db.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const oldStatus = existingOrder.status;

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
      include: {
        buyer: { select: { name: true, email: true } },
        prompt: { select: { title: true } },
      },
    });

    // If status is COMPLETED, credit the seller's balance
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await db.user.update({
        where: { id: existingOrder.sellerId },
        data: {
          currentBalance: { increment: existingOrder.sellerAmount },
          totalEarnings: { increment: existingOrder.sellerAmount },
        },
      });
    }

    // If status is CANCELLED or FAILED and was previously COMPLETED, reverse the seller credit
    if ((status === 'CANCELLED' || status === 'FAILED') && oldStatus === 'COMPLETED') {
      await db.user.update({
        where: { id: existingOrder.sellerId },
        data: {
          currentBalance: { decrement: Math.min(existingOrder.sellerAmount, existingOrder.sellerAmount) },
          totalEarnings: { decrement: existingOrder.sellerAmount },
        },
      });
    }

    // Create ActivityLog entry
    await db.activityLog.create({
      data: {
        userId: user.id!,
        action: `ORDER_STATUS_CHANGE`,
        details: `Order ${existingOrder.orderId} status changed from ${oldStatus} to ${status}`,
      },
    });

    // If status changes to COMPLETED, create a Notification for the buyer
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await db.notification.create({
        data: {
          userId: existingOrder.buyerId,
          title: 'Order Completed',
          message: `Your order ${existingOrder.orderId.slice(-8).toUpperCase()} for "${updatedOrder.prompt?.title || 'a prompt'}" has been completed.`,
          type: 'ORDER',
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
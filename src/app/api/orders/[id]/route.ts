import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatar: true } },
        prompt: {
          include: {
            seller: { select: { id: true, name: true, email: true } },
            category: true,
          }
        },
        revenue: true,
      }
    });

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Enforce security: Only buyer, seller, or admin can view the order receipt
    if (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

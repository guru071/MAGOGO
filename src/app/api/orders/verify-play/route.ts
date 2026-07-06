import crypto from 'crypto';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { packageName, productId, purchaseToken, promptIds } = await req.json();
    if (!packageName || !productId || !purchaseToken || !promptIds?.length) {
      return NextResponse.json({ success: false, error: 'Missing required Play Store fields' }, { status: 400 });
    }

    const results: any[] = [];
    for (const promptId of promptIds) {
      const prompt = await db.prompt.findUnique({ where: { id: promptId } });
      if (!prompt || prompt.status !== 'APPROVED') continue;
      if (prompt.sellerId === user.id!) continue;

      const existing = await db.order.findFirst({
        where: { buyerId: user.id!, promptId, status: 'COMPLETED' },
      });
      if (existing) continue;

      const order = await db.order.create({
        data: {
          orderId: `PLAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`,
          buyerId: user.id!,
          promptId,
          sellerId: prompt.sellerId,
          amount: prompt.price,
          platformFee: 0,
          sellerAmount: prompt.price,
          paymentMethod: 'PLAY_STORE',
          paymentId: purchaseToken,
          currency: 'USD',
          status: 'COMPLETED',
        },
      });

      await db.prompt.update({
        where: { id: promptId },
        data: { downloadCount: { increment: 1 } },
      });

      await db.user.update({
        where: { id: prompt.sellerId },
        data: {
          totalEarnings: { increment: prompt.price },
          currentBalance: { increment: prompt.price },
        },
      });

      await db.user.update({
        where: { id: user.id! },
        data: { totalSpent: { increment: prompt.price } },
      });

      results.push(order);
    }

    return NextResponse.json({ success: true, data: results }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

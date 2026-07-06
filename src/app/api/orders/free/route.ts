import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { promptIds } = await req.json();
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No prompts provided' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const created: any[] = [];
      for (const promptId of promptIds) {
        const prompt = await tx.prompt.findUnique({ where: { id: promptId } });
        if (!prompt || prompt.status !== 'APPROVED') {
          throw new Error(`Prompt ${promptId} is not available`);
        }
        if (prompt.sellerId === user.id) {
          throw new Error('Cannot buy your own prompt');
        }
        if (!prompt.isFree && prompt.price > 0) {
          throw new Error(`Prompt ${prompt.title} is not free`);
        }

        const existing = await tx.order.findFirst({
          where: { buyerId: user.id!, promptId, status: 'COMPLETED' }
        });
        if (existing) continue;

        const order = await tx.order.create({
          data: {
            orderId: `FREE-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`,
            buyerId: user.id!,
            promptId: prompt.id,
            sellerId: prompt.sellerId,
            amount: 0,
            platformFee: 0,
            sellerAmount: 0,
            commissionRate: 0,
            commissionAmt: 0,
            gstRate: 0,
            gstAmt: 0,
            closingFee: 0,
            paymentFeeRate: 0,
            paymentFeeAmt: 0,
            totalFees: 0,
            netAmount: 0,
            paymentMethod: 'FREE',
            currency: 'USD',
            status: 'COMPLETED',
          }
        });

        await tx.prompt.update({
          where: { id: promptId },
          data: { downloadCount: { increment: 1 } }
        });

        created.push(order);
      }
      return created;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal server error' }, { status: 400 });
  }
}

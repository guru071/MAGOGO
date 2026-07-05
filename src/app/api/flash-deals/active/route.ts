import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const deals = await db.flashDeal.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        prompt: {
          select: {
            title: true,
            price: true,
            slug: true,
            sampleImages: true,
            seller: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: deals });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

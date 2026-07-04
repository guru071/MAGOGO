import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

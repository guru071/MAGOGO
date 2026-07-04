import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { promptId } = await req.json();
    if (!promptId) return NextResponse.json({ success: false, error: 'promptId required' }, { status: 400 });

    const prompt = await db.prompt.findUnique({
      where: { id: promptId },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, isSeller: true, totalEarnings: true } },
        _count: { select: { reviews: true, likes: true } },
      },
    });

    if (!prompt) return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });

    const categoryPrompts = await db.prompt.findMany({
      where: { categoryId: prompt.categoryId, status: 'APPROVED', price: { gt: 0 } },
      select: { price: true },
      take: 50,
    });
    const avgPrice = categoryPrompts.length
      ? categoryPrompts.reduce((s, p) => s + Number(p.price), 0) / categoryPrompts.length
      : null;

    const promptData = {
      ...prompt,
      _count: undefined,
      reviews: await db.review.findMany({ where: { promptId }, select: { rating: true } }),
    };

    const result = await ai.quality.score(promptData as any, avgPrice || undefined);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

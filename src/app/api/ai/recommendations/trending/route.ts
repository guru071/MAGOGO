import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-client';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

export async function GET(req: NextRequest) {
  try {
    const topN = parseInt(req.nextUrl.searchParams.get('top_n') || '20');
    const user = await getCurrentUser();

    const prompts = await db.prompt.findMany({
      where: { status: 'APPROVED' },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true, likes: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 100,
    });

    const promptsData = prompts.map(p => ({
      ...p,
      reviewCount: p._count.reviews,
      likeCount: p._count.likes,
      _count: undefined,
    }));

    let trending = promptsData.slice(0, topN);

    const aiResult = await ai.recommend.trending(topN);
    if (aiResult.success && aiResult.data) {
      trending = aiResult.data as any[];
    }

    return NextResponse.json({ success: true, data: await sanitizePromptsForUser(trending, user) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

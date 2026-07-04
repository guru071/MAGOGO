import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const topN = parseInt(req.nextUrl.searchParams.get('top_n') || '20');

    const prompts = await db.prompt.findMany({
      where: { status: 'APPROVED' },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, isSeller: true, totalEarnings: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const promptsData = prompts.map(p => ({
      ...p,
      reviewCount: p._count.reviews,
      likeCount: p._count.likes,
      _count: undefined,
    }));

    let recommendations = promptsData;

    if (user) {
      const aiResult = await ai.recommend.forUser(user.id?.toString(), promptsData, topN);
      if (aiResult.success && aiResult.data) {
        recommendations = aiResult.data as any[];
      }
    }

    const safeRecommendations = await sanitizePromptsForUser(recommendations, user);

    return NextResponse.json({ success: true, data: { recommendations: safeRecommendations, total: safeRecommendations.length } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-client';
import { getCurrentUser } from '@/lib/auth-helpers';
import { canViewPromptMetadata, sanitizePromptForUser, sanitizePromptsForUser } from '@/lib/prompt-security';

export async function GET(req: NextRequest) {
  try {
    const promptId = req.nextUrl.searchParams.get('promptId');
    const topN = parseInt(req.nextUrl.searchParams.get('top_n') || '6');
    const user = await getCurrentUser();

    if (!promptId) {
      return NextResponse.json({ success: false, error: 'promptId required' }, { status: 400 });
    }

    const prompt = await db.prompt.findUnique({
      where: { id: promptId },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        category: true,
      },
    });

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }
    if (!canViewPromptMetadata(prompt, user)) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    const allPrompts = await db.prompt.findMany({
      where: { status: 'APPROVED', id: { not: promptId } },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true, likes: true } },
      },
      take: 200,
    });

    const promptsData = allPrompts.map(p => ({
      ...p,
      reviewCount: p._count.reviews,
      likeCount: p._count.likes,
      _count: undefined,
    }));

    let similar: any[] = [];

    const aiResult = await ai.recommend.similar(
      {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        tags: prompt.tags,
        categoryId: prompt.categoryId,
        sellerId: prompt.sellerId,
        price: prompt.price,
      },
      promptsData as any,
      topN,
    );

    if (aiResult.success && aiResult.data) {
      similar = aiResult.data as any[];
    }

    return NextResponse.json({
      success: true,
      data: {
        prompt: await sanitizePromptForUser(prompt, user),
        similar: await sanitizePromptsForUser(similar, user),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

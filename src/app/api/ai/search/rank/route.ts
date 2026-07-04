import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

export async function POST(req: NextRequest) {
  try {
    const { query, page = 1, limit = 12, category, sort, isFree, minPrice, maxPrice, tags, ai: aiFilter } = await req.json();
    const user = await getCurrentUser();

    const where: any = { status: 'APPROVED' };
    if (category) where.categoryId = category;
    if (isFree === 'true') where.isFree = true;
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (tags) where.tags = { contains: tags };
    if (aiFilter) where.recommendedAI = { contains: aiFilter };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [prompts, total] = await Promise.all([
      db.prompt.findMany({
        where,
        orderBy: sort === 'popular' ? { likeCount: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit * 3,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, isSeller: true, totalEarnings: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true, likes: true } },
        },
      }),
      db.prompt.count({ where }),
    ]);

    const promptsData = prompts.map(p => ({
      ...p,
      reviewCount: p._count.reviews,
      likeCount: p._count.likes,
      _count: undefined,
    }));

    let ranked = promptsData;
    if (query && query.trim()) {
      const aiResult = await ai.search.rank(query, promptsData, user?.id?.toString());
      if (aiResult.success && aiResult.data) {
        ranked = aiResult.data as any[];
      }
    }

    const final = await sanitizePromptsForUser(ranked.slice(0, limit), user);

    return NextResponse.json({
      success: true,
      data: { prompts: final, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

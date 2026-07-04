import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';
import { canViewPromptMetadata, sanitizePromptForUser, sanitizePromptsForUser } from '@/lib/prompt-security';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function normalizePath(path?: string[]) {
  return (path || []).join('/');
}

async function getSuggest(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || req.nextUrl.searchParams.get('query') || '';
  const topN = parseInt(req.nextUrl.searchParams.get('top_n') || '5');

  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, data: [], categories: [], tags: [] });
  }

  const prompts: string[] = [];
  const categories: string[] = [];
  const tags: string[] = [];

  const aiResult = await ai.search.suggest(query, topN);
  if (aiResult.success && aiResult.data) {
    (aiResult.data as string[]).forEach(s => prompts.push(s));
  }

  const dbPrompts = await db.prompt.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { title: true, tags: true },
    take: 15,
  });

  const lowerQuery = query.toLowerCase();
  for (const p of dbPrompts) {
    if (p.title.toLowerCase().includes(lowerQuery)) prompts.push(p.title.slice(0, 80));
    try {
      const parsed = JSON.parse(p.tags || '[]');
      if (Array.isArray(parsed)) {
        parsed.forEach((tag: string) => {
          if (tag.toLowerCase().includes(lowerQuery)) tags.push(tag.slice(0, 80));
        });
      }
    } catch {
      if (p.tags && p.tags.toLowerCase().includes(lowerQuery)) tags.push(p.tags.slice(0, 80));
    }
  }

  const dbCategories = await db.category.findMany({
    where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
    select: { name: true },
    take: 5,
  });
  dbCategories.forEach(category => categories.push(category.name));

  return NextResponse.json({
    success: true,
    data: [...new Set(prompts)].slice(0, 6),
    categories: [...new Set(categories)].slice(0, 4),
    tags: [...new Set(tags)].slice(0, 4),
  });
}

async function postRank(req: NextRequest) {
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

  const promptsData = prompts.map(prompt => ({
    ...prompt,
    reviewCount: prompt._count.reviews,
    likeCount: prompt._count.likes,
    _count: undefined,
  }));

  let ranked = promptsData;
  if (query && query.trim()) {
    const aiResult = await ai.search.rank(query, promptsData, user?.id?.toString());
    if (aiResult.success && aiResult.data) ranked = aiResult.data as any[];
  }

  return NextResponse.json({
    success: true,
    data: {
      prompts: await sanitizePromptsForUser(ranked.slice(0, limit), user),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getTrending(req: NextRequest) {
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

  const promptsData = prompts.map(prompt => ({
    ...prompt,
    reviewCount: prompt._count.reviews,
    likeCount: prompt._count.likes,
    _count: undefined,
  }));

  let trending = promptsData.slice(0, topN);
  const aiResult = await ai.recommend.trending(topN);
  if (aiResult.success && aiResult.data) trending = aiResult.data as any[];

  return NextResponse.json({ success: true, data: await sanitizePromptsForUser(trending, user) });
}

async function getSimilar(req: NextRequest) {
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

  const promptsData = allPrompts.map(item => ({
    ...item,
    reviewCount: item._count.reviews,
    likeCount: item._count.likes,
    _count: undefined,
  }));

  const aiResult = await ai.recommend.similar({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    tags: prompt.tags,
    categoryId: prompt.categoryId,
    sellerId: prompt.sellerId,
    price: prompt.price,
  }, promptsData as any, topN);

  return NextResponse.json({
    success: true,
    data: {
      prompt: await sanitizePromptForUser(prompt, user),
      similar: await sanitizePromptsForUser(aiResult.success && aiResult.data ? aiResult.data as any[] : [], user),
    },
  });
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const path = normalizePath((await context.params).path);
    if (path === 'search/suggest') return getSuggest(req);
    if (path === 'recommendations/trending') return getTrending(req);
    if (path === 'recommendations/similar') return getSimilar(req);
    return NextResponse.json({ success: false, error: 'AI route not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const path = normalizePath((await context.params).path);
    if (path === 'search/rank') return postRank(req);
    return NextResponse.json({ success: false, error: 'AI route not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

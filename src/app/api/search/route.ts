import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sanitizePromptsForUser } from '@/lib/prompt-security';
import { formatUSD } from '@/lib/currencies';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function getSpellingSuggestion(query: string, knownTerms: string[]): string | null {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return null;
  let bestSuggestion: string | null = null;
  let bestDist = Infinity;
  for (const term of knownTerms) {
    const termTokens = tokenize(term);
    for (const qt of queryTokens) {
      for (const tt of termTokens) {
        if (Math.abs(qt.length - tt.length) > 3) continue;
        const dist = levenshtein(qt, tt);
        if (dist > 0 && dist < bestDist && dist <= Math.max(2, Math.floor(qt.length / 3))) {
          bestDist = dist;
          bestSuggestion = query.replace(new RegExp(qt, 'i'), tt);
        }
      }
    }
  }
  return bestSuggestion;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const tags = searchParams.get('tags');
    const minRating = searchParams.get('rating');
    const user = await getCurrentUser();

    const where: any = { status: 'APPROVED' };
    if (category) where.categoryId = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.AND = tagList.map(t => ({ tags: { contains: t, mode: 'insensitive' } }));
      }
    }
    if (minRating) where.rating = { gte: parseFloat(minRating) };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'rating') orderBy = { rating: 'desc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'relevance') orderBy = [{ likeCount: 'desc' }, { rating: 'desc' }];

    // Build a filter-aware where clause for facets (same filters as main query but without price range for category/tag facets)
    const facetWhere = { ...where };
    // Don't pass price range to category/tag facets since ranges are relative
    delete facetWhere.price;

    const [prompts, total, categoryFacets, allPriceData, allTagData] = await Promise.all([
      db.prompt.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      db.prompt.count({ where }),
      db.prompt.groupBy({
        by: ['categoryId'],
        where: facetWhere,
        _count: { id: true },
      }),
      db.prompt.aggregate({
        where,
        _min: { price: true },
        _max: { price: true },
      }),
      db.prompt.findMany({
        where: facetWhere,
        select: { tags: true },
        take: 200,
      }),
    ]);

    // Build price-range facets from aggregate stats (avoids loading all rows)
    const globalMin = allPriceData._min.price ?? 0;
    const globalMax = allPriceData._max.price ?? 100;
    const priceRanges = [
      { label: `${formatUSD(globalMin)} - ${formatUSD(5)}`, min: globalMin, max: 5 },
      { label: `${formatUSD(5)} - ${formatUSD(15)}`, min: 5, max: 15 },
      { label: `${formatUSD(15)} - ${formatUSD(30)}`, min: 15, max: 30 },
      { label: `${formatUSD(30)} - ${formatUSD(50)}`, min: 30, max: 50 },
      { label: `${formatUSD(Math.max(50, Math.round(globalMax)))}+`, min: 50, max: globalMax + 1 },
    ];

    const categoriesList = await db.category.findMany({
      where: { id: { in: categoryFacets.map(c => c.categoryId) } },
      select: { id: true, name: true },
    });

    const facets = {
      categories: categoryFacets.map(f => {
        const cat = categoriesList.find(c => c.id === f.categoryId);
        return { id: f.categoryId, name: cat?.name || 'Unknown', count: f._count.id };
      }).sort((a, b) => b.count - a.count),
      priceRanges: priceRanges.map(range => ({
        ...range,
        count: 0,
      })),
      tags: [] as { name: string; count: number }[],
    };

    const tagCounts = new Map<string, number>();
    for (const p of allTagData) {
      try {
        const parsed = JSON.parse(p.tags || '[]');
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
          }
        }
      } catch (e) {
        console.error('[search] parse tag error', e);
        if (p.tags) tagCounts.set(p.tags, (tagCounts.get(p.tags) || 0) + 1);
      }
    }
    facets.tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    let suggestion: string | null = null;
    if (query && total < 3) {
      const knownTerms = await db.category.findMany({ select: { name: true } }).then(cats => cats.map(c => c.name));
      try {
        const tagSamples = await db.prompt.findMany({
          where: { status: 'APPROVED' },
          select: { tags: true },
          take: 100,
        });
        for (const p of tagSamples) {
          try {
            const parsed = JSON.parse(p.tags || '[]');
            if (Array.isArray(parsed)) knownTerms.push(...parsed);
          } catch (e) { console.error('[search] tag parse error', e); if (p.tags) knownTerms.push(p.tags); }
        }
      } catch (e) { console.error('[search] query known terms error', e); }
      suggestion = getSpellingSuggestion(query, [...new Set(knownTerms)]);
    }

    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      success: true,
      data: {
        prompts: await sanitizePromptsForUser(prompts, user),
        total,
        page,
        totalPages,
        facets,
        suggestion,
      },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

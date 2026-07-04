import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/ai-client';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q') || req.nextUrl.searchParams.get('query') || '';
    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [], categories: [], tags: [] });
    }

    const prompts: string[] = [];
    const categories: string[] = [];
    const tags: string[] = [];

    const aiResult = await ai.search.suggest(query);
    if (aiResult.success && aiResult.data) {
      const aiSuggestions = aiResult.data as string[];
      aiSuggestions.forEach(s => prompts.push(s));
    }

    const dbPrompts = await db.prompt.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { title: true, tags: true, categoryId: true },
      take: 15,
    });

    const localTitles = new Set<string>();
    const localTags = new Set<string>();
    for (const p of dbPrompts) {
      if (p.title.toLowerCase().includes(query.toLowerCase())) {
        localTitles.add(p.title.slice(0, 80));
      }
      try {
        const parsed = JSON.parse(p.tags || '[]');
        if (Array.isArray(parsed)) {
          parsed.forEach((t: string) => {
            if (t.toLowerCase().includes(query.toLowerCase())) localTags.add(t.slice(0, 80));
          });
        }
      } catch (e) {
        console.error('[ai/search/suggest] parse tags error', e);
        if (p.tags && p.tags.toLowerCase().includes(query.toLowerCase())) localTags.add(p.tags.slice(0, 80));
      }
    }

    const dbCategories = await db.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
      select: { name: true },
      take: 5,
    });

    prompts.push(...localTitles);
    dbCategories.forEach(c => categories.push(c.name));
    tags.push(...localTags);

    return NextResponse.json({
      success: true,
      data: [...new Set(prompts)].slice(0, 6),
      categories: [...new Set(categories)].slice(0, 4),
      tags: [...new Set(tags)].slice(0, 4),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

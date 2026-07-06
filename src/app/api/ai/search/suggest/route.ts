import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, data: [], categories: [], tags: [] });
    }

    const query = q.trim();

    const [prompts, categories, promptsByTag] = await Promise.all([
      db.prompt.findMany({
        where: {
          status: 'APPROVED',
          title: { contains: query, mode: 'insensitive' },
        },
        select: { title: true },
        take: 4,
        orderBy: { downloadCount: 'desc' },
      }),
      db.category.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        select: { name: true },
        take: 3,
        orderBy: { promptCount: 'desc' },
      }),
      db.prompt.findMany({
        where: {
          status: 'APPROVED',
          tags: { contains: query, mode: 'insensitive' },
        },
        select: { tags: true },
        take: 3,
        orderBy: { downloadCount: 'desc' },
      }),
    ]);

    const suggestData = prompts.map(p => p.title);

    const categoryNames = categories.map(c => c.name);

    const tagSet = new Set<string>();
    for (const p of promptsByTag) {
      try {
        const tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
        if (Array.isArray(tags)) {
          tags.forEach((t: string) => {
            if (typeof t === 'string' && t.toLowerCase().includes(query.toLowerCase())) {
              tagSet.add(t);
            }
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: suggestData,
      categories: categoryNames,
      tags: Array.from(tagSet).slice(0, 3),
    });
  } catch {
    return NextResponse.json({ success: true, data: [], categories: [], tags: [] });
  }
}

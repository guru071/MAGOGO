import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const categories = await db.category.findMany({
      include: { _count: { select: { prompts: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const data = categories.map(c => ({ ...c, promptCount: c._count.prompts, _count: undefined }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, slug, icon, description, parentId, sortOrder } = body;

    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const finalSlug = slug?.trim() || slugify(name);

    // Check slug uniqueness
    const existing = await db.category.findUnique({ where: { slug: finalSlug } });
    if (existing) return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 400 });

    // Validate parentId if provided
    if (parentId) {
      const parent = await db.category.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ success: false, error: 'Parent category not found' }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        icon: icon || null,
        description: description?.trim() || null,
        parentId: parentId || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
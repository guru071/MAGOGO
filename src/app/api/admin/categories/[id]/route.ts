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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    // Check category exists
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });

    // If name is being updated and slug is not provided, regenerate slug
    const updateData: any = { ...body };
    if (body.name && !body.slug) {
      updateData.slug = slugify(body.name);
    }

    // If slug is being changed, check uniqueness
    if (updateData.slug && updateData.slug !== existing.slug) {
      const slugExists = await db.category.findUnique({ where: { slug: updateData.slug } });
      if (slugExists) return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 400 });
    }

    // Validate parentId if provided
    if (body.parentId) {
      if (body.parentId === id) return NextResponse.json({ success: false, error: 'Category cannot be its own parent' }, { status: 400 });
      const parent = await db.category.findUnique({ where: { id: body.parentId } });
      if (!parent) return NextResponse.json({ success: false, error: 'Parent category not found' }, { status: 400 });
    }

    // Clean up fields — don't allow updating id, createdAt, etc.
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData._count;

    const category = await db.category.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: category });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { prompts: true, children: true } } },
    });

    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    if (category._count.prompts > 0) return NextResponse.json({ success: false, error: `Cannot delete: this category has ${category._count.prompts} prompt(s). Remove or reassign them first.` }, { status: 400 });
    if (category._count.children > 0) return NextResponse.json({ success: false, error: `Cannot delete: this category has ${category._count.children} subcategory(ies). Delete them first.` }, { status: 400 });

    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
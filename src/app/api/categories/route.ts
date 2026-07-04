import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const where: any = { isActive: true };
    if (parentId) where.parentId = parentId; else where.parentId = null;
    const cats = await db.category.findMany({ where, include: { _count: { select: { prompts: { where: { status: 'APPROVED' } } } } }, orderBy: { sortOrder: 'asc' } });
    const data = cats.map(c => ({ ...c, promptCount: c._count.prompts, _count: undefined }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
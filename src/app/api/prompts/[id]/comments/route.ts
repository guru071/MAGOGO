import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = await db.comment.findMany({ where: { promptId: id, parentId: null }, include: { user: { select: { id: true, name: true, avatar: true } }, replies: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: comments });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { content, parentId } = await req.json();
    if (!content) return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
    const comment = await db.comment.create({ data: { userId: user.id!, promptId: id, content, parentId: parentId || null }, include: { user: { select: { id: true, name: true, avatar: true } } } });
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

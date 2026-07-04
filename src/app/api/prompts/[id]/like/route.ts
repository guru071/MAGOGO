import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await db.like.findUnique({ where: { userId_promptId: { userId: user.id!, promptId: id } } });
    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      await db.prompt.update({ where: { id }, data: { likeCount: { decrement: 1 } } });
      return NextResponse.json({ success: true, data: { liked: false } });
    } else {
      await db.like.create({ data: { userId: user.id!, promptId: id } });
      await db.prompt.update({ where: { id }, data: { likeCount: { increment: 1 } } });
      return NextResponse.json({ success: true, data: { liked: true } });
    }
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

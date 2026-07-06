import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { isRead } = await req.json();
    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (notification.userId !== user.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    await db.notification.update({ where: { id }, data: { isRead } });
    return NextResponse.json({ success: true });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

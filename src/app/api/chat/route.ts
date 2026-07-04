import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const messages = await db.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id! },
          { receiverId: user.id! }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });

    const message = await db.chatMessage.create({
      data: {
        senderId: user.id!,
        receiverId: user.id!,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const msg = await db.chatMessage.findUnique({ where: { id } });
      if (!msg || msg.senderId !== user.id!) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      await db.chatMessage.delete({ where: { id } });
    } else {
      await db.chatMessage.deleteMany({ where: { senderId: user.id! } });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

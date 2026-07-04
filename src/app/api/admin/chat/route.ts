import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Get chat sessions (list of users who have chatted) and messages for a specific user
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Fetch messages for a specific user
      const messages = await db.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ success: true, data: messages });
    } else {
      // Fetch list of users who have sent messages
      // We will group by senderId where senderId is not an admin
      const chatSenders = await db.chatMessage.findMany({
        select: { senderId: true, sender: { select: { id: true, name: true, email: true, avatar: true } }, createdAt: true, isRead: true },
        orderBy: { createdAt: 'desc' },
      });

      // deduplicate users to show a list of unique chat sessions
      const sessionsMap = new Map();
      chatSenders.forEach(msg => {
        if (!sessionsMap.has(msg.senderId)) {
          sessionsMap.set(msg.senderId, {
            user: msg.sender,
            lastMessageAt: msg.createdAt,
            hasUnread: !msg.isRead
          });
        }
      });

      // Filter out admins (we only want users who reached out for support)
      // Actually we just filter out the current admin
      sessionsMap.delete(admin.id);

      return NextResponse.json({ success: true, data: Array.from(sessionsMap.values()) });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { content, receiverId } = await req.json();
    if (!content?.trim() || !receiverId) return NextResponse.json({ success: false, error: 'Content and receiverId required' }, { status: 400 });

    const message = await db.chatMessage.create({
      data: {
        senderId: admin.id!,
        receiverId: receiverId,
        content: content.trim(),
        messageType: 'TEXT',
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Mark messages as read
export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });

    await db.chatMessage.updateMany({
      where: { senderId: userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

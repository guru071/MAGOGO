import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// GET – list all broadcasts (Notification records with type = 'BROADCAST')
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // A broadcast is a notification with type 'BROADCAST'. To avoid duplicates
    // (one row per user) we group by the title+message+createdAt and pick the
    // earliest id as the "canonical" broadcast row.
    const broadcastsRaw = await db.$queryRawUnsafe<
      Array<{
        id: string;
        title: string;
        message: string;
        type: string;
        createdAt: string;
        recipientCount: bigint;
      }>
    >(
      `SELECT n1.id, n1.title, n1.message, n1.type, n1."createdAt",
              COUNT(*) AS recipientCount
       FROM "Notification" n1
       INNER JOIN (
         SELECT MIN(id) AS minId
         FROM "Notification"
         WHERE type = 'BROADCAST'
         GROUP BY title, message
       ) n2 ON n1.id = n2.minId
       GROUP BY n1.id
       ORDER BY n1."createdAt" DESC
       LIMIT 50`,
    );

    const broadcasts = broadcastsRaw.map((b) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      type: b.type,
      createdAt: b.createdAt,
      recipientCount: Number(b.recipientCount),
    }));

    return NextResponse.json({ success: true, data: broadcasts });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST – create a new broadcast for all active users
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, type } = body as {
      title?: string;
      message?: string;
      type?: string;
    };

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 },
      );
    }

    // Fetch all active user IDs
    const activeUsers = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        data: { notified: 0, message: 'No active users found' },
      });
    }

    // Create notification records in a batch
    // Always store as BROADCAST type so GET can find them
    await db.notification.createMany({
      data: activeUsers.map((u) => ({
        userId: u.id,
        title: `[${type || 'SYSTEM'}] ${title.trim()}`,
        message: message.trim(),
        type: 'BROADCAST',
      })),
    });

    // Log the action in ActivityLog
    await db.activityLog.create({
      data: {
        userId: user.id!,
        action: 'BROADCAST_NOTIFICATION',
        details: `Sent broadcast "${title.trim()}" to ${activeUsers.length} users`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notified: activeUsers.length,
        message: `Broadcast sent to ${activeUsers.length} active users`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
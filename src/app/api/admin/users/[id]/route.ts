import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await req.json();

    // If this is a ban request, create an activity log
    if (body.banReason && body.isActive === false) {
      // Ban user
      const user = await db.user.update({
        where: { id },
        data: { isActive: false, isBanned: true },
      });
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_BANNED',
          details: `Banned user "${user.name}" (${user.email}). Reason: ${body.banReason}`,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
      });
      return NextResponse.json({ success: true, data: user });
    }

    // If unban
    if (body.unban) {
      const user = await db.user.update({
        where: { id },
        data: { isActive: true, isBanned: false },
      });
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_UNBANNED',
          details: `Unbanned user "${user.name}" (${user.email})`,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
      });
      return NextResponse.json({ success: true, data: user });
    }

    const allowedFields = ['name', 'email', 'bio', 'avatar', 'country'];
    const filteredData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        filteredData[key] = body[key];
      }
    }
    const user = await db.user.update({ where: { id }, data: filteredData });
    return NextResponse.json({ success: true, data: user });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
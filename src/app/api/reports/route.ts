import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        prompt: { select: { id: true, title: true, seller: { select: { name: true } } } },
      },
      take: 50,
    });

    return NextResponse.json({ success: true, data: reports });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { promptId, reason, description } = await req.json();
    if (!promptId || !reason) return NextResponse.json({ success: false, error: 'promptId and reason required' }, { status: 400 });
    const sanitizedReason = sanitizeInput(reason);
    const sanitizedDescription = sanitizeInput(description || '');

    // Check if user already reported this prompt
    const existing = await db.report.findFirst({ where: { reporterId: user.id!, promptId } });
    if (existing) return NextResponse.json({ success: false, error: 'You have already reported this prompt' }, { status: 400 });

    const report = await db.report.create({
      data: { reporterId: user.id!, promptId, reason: sanitizedReason, description: sanitizedDescription },
    });

    await db.activityLog.create({
      data: { userId: user.id!, action: 'CONTENT_REPORTED', details: JSON.stringify({ promptId, reason }) },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
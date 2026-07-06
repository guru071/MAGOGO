import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ success: false, error: 'Status required' }, { status: 400 });

    const report = await db.report.update({
      where: { id },
      data: { status },
    });

    // Notify reporter if resolved
    if (status === 'RESOLVED') {
      await db.notification.create({
        data: { userId: report.reporterId, title: 'Report Resolved', message: `Your report has been reviewed and resolved.`, type: 'SYSTEM' },
      });
    }

    return NextResponse.json({ success: true, data: report });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [qnas, total] = await Promise.all([
      db.qnA.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          answer: { select: { id: true, name: true, avatar: true } },
          prompt: { select: { id: true, title: true } },
        },
      }),
      db.qnA.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        qnas,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'QnA ID required' }, { status: 400 });

    await db.qnA.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId: user.id!,
        action: 'ADMIN_DELETED_QNA',
        details: JSON.stringify({ qnaId: id }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

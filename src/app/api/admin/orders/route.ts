import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { buyer: { name: { contains: search } } },
        { buyer: { email: { contains: search } } },
        { prompt: { title: { contains: search } } },
      ];
    }

    const [orders, total, totalValue] = await Promise.all([
      db.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          buyer: { select: { name: true, email: true } },
          prompt: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.order.count({ where }),
      db.order.aggregate({ _sum: { amount: true }, where }),
    ]);

    // Count per status
    const statusCounts = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => { statusMap[s.status] = s._count.status; });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        total,
        pages: Math.ceil(total / limit),
        totalValue: totalValue._sum.amount || 0,
        statusCounts: statusMap,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const [totalUsers, sellers, prompts, revenue, orders, pending] = await Promise.all([
      db.user.count(), db.user.count({ where: { isSeller: true } }),
      db.prompt.count({ where: { status: 'APPROVED' } }),
      db.order.aggregate({ _sum: { amount: true } }),
      db.order.count(), db.prompt.count({ where: { status: 'PENDING' } })
    ]);
    const recentOrders = await db.order.findMany({ take: 10, include: { buyer: { select: { name: true } }, prompt: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
    const topSellers = await db.user.findMany({ where: { isSeller: true }, orderBy: { totalEarnings: 'desc' }, take: 5, select: { id: true, name: true, avatar: true, totalEarnings: true, _count: { select: { prompts: true } } } });
    return NextResponse.json({ success: true, data: { totalUsers, totalSellers: sellers, totalPrompts: prompts, totalRevenue: revenue._sum.amount || 0, totalOrders: orders, pendingPrompts: pending, recentOrders, topSellers } });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
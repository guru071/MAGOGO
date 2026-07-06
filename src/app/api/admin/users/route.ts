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
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const where: any = {};
    if (role && role !== 'ALL') where.role = role;
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (status === 'banned') where.isActive = false;
    if (status === 'banned') { where.isActive = false; }
    if (status === 'active') { where.isActive = true; }
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true, isSeller: true,
          isVerified: true, isActive: true, totalEarnings: true, totalSpent: true,
          createdAt: true, lastLoginAt: true,
          isOnline: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { users, total, pages: Math.ceil(total / limit) } });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
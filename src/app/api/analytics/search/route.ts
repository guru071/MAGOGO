import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';

function normalizeCount(value: unknown): number {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.floor(count);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim().slice(0, 500);

    if (!query) {
      return NextResponse.json({ success: false, error: 'query required' }, { status: 400 });
    }

    const user = await getCurrentUser().catch(() => null);

    try {
      await db.searchLog.create({
        data: {
          query,
          userId: user?.id?.toString() || null,
          resultsCount: normalizeCount(body.resultsCount),
          source: String(body.source || 'NAVBAR').slice(0, 60),
        },
      });
      return NextResponse.json({ success: true, logged: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
        return NextResponse.json({ success: true, logged: false, reason: 'search log table missing' });
      }
      throw error;
    }
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db.searchLog.groupBy({
      by: ['query'],
      where: { createdAt: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: rows.map(row => ({ query: row.query, count: row._count.query })),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: false, error: 'Failed to load search analytics' }, { status: 500 });
  }
}

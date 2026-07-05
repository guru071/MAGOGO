import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(_req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isSeller && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const prompts = await db.prompt.findMany({
      where: {
        sellerId: user.id,
        status: { not: 'DELETED' }, // Don't show soft-deleted ones in their list either, unless they want to recover them. The requirement says "can delete anytime" so once deleted it's gone from view.
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        _count: { select: { orders: true } }
      }
    });

    return NextResponse.json({ success: true, data: prompts });
  } catch (error: unknown) {
    console.error('[API] GET /api/seller/prompts error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

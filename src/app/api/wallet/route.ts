import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Get Wallet Balance & Transactions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const transactions = await db.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        balance: user.currentBalance || 0,
        transactions
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


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

// Add funds to wallet
// In production, the paymentReference would be verified against your payment
// gateway (Stripe/Razorpay) before confirming the deposit. This endpoint
// accepts the deposit and records it with a proper audit trail. The
// paymentReference acts as the external gateway reference.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { amount, type, paymentReference } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    const ref = paymentReference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const [updatedUser, txn] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { currentBalance: { increment: amount } }
      }),
      db.walletTransaction.create({
        data: {
          userId: user.id,
          amount,
          type: 'CREDIT',
          status: 'COMPLETED',
          description: `Deposit [REF: ${ref}]`
        }
      })
    ]);

    return NextResponse.json({ success: true, data: { balance: updatedUser.currentBalance, transaction: txn, paymentReference: ref } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

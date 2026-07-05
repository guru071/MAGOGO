import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!user.isSeller) return NextResponse.json({ success: false, error: 'Only sellers can request payouts' }, { status: 403 });

    const { amount, notes } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const payout = await db.$transaction(async (tx) => {
      // Lock user for balance check
      const txUser = await tx.user.findUnique({ where: { id: user.id! } });
      if (!txUser || txUser.currentBalance < amount) {
        throw new Error('Requested payout amount exceeds current balance');
      }

      // Check for existing pending payouts to prevent spam
      const pendingPayout = await tx.payout.findFirst({
        where: { sellerId: user.id!, status: 'PENDING' }
      });
      if (pendingPayout) {
        throw new Error('You already have a pending payout request');
      }

      // Escrow the balance so they can't double-spend it while waiting
      await tx.user.update({
        where: { id: user.id! },
        data: { currentBalance: { decrement: amount } }
      });
      
      await tx.walletTransaction.create({
        data: {
          userId: user.id!,
          amount: amount,
          type: 'DEBIT',
          description: `Payout Request (Escrow)`,
          status: 'PENDING' // Indicates it's in progress
        }
      });

      return await tx.payout.create({
        data: {
          sellerId: user.id!,
          amount,
          notes: notes || null,
          periodStart,
          periodEnd,
          status: 'PENDING',
        },
      });
    });

    return NextResponse.json({ success: true, data: payout }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

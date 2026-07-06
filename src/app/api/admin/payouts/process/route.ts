import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { formatUSD } from '@/lib/currencies';

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const sellers = await db.user.findMany({ where: { isSeller: true, currentBalance: { gt: 0 } } });
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const results: any[] = [];
    for (const seller of sellers) {
      const amount = seller.currentBalance;
      const payout: any = await db.payout.create({
        data: { sellerId: seller.id, amount, periodStart: tenDaysAgo, periodEnd: new Date(), status: 'COMPLETED', transactionId: `PAY-${Date.now().toString(36).toUpperCase()}`, notes: 'Automatic payout' }
      });
      await db.user.update({ where: { id: seller.id }, data: { currentBalance: 0 } });
      await db.notification.create({ data: { userId: seller.id, title: 'Payout Processed!', message: `${formatUSD(amount)} has been processed to your account.`, type: 'PAYOUT' } });
      results.push(payout);
    }
    return NextResponse.json({ success: true, data: { processed: results.length, payouts: results } });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
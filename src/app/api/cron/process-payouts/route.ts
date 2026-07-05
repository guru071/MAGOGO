import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayXContact, createRazorpayXFundAccount, createRazorpayXPayout } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const ordersToPay = await db.order.findMany({
      where: { status: 'COMPLETED', payoutId: null, createdAt: { lte: tenDaysAgo } },
      include: { prompt: { include: { seller: true } } }
    });

    if (ordersToPay.length === 0) {
      return NextResponse.json({ success: true, message: 'No payouts to process' });
    }

    const sellerPayouts: Record<string, { amount: number, orderIds: string[], seller: any }> = {};
    for (const order of ordersToPay) {
      if (!sellerPayouts[order.sellerId]) {
        sellerPayouts[order.sellerId] = { amount: 0, orderIds: [], seller: order.prompt.seller };
      }
      sellerPayouts[order.sellerId].amount += order.sellerAmount;
      sellerPayouts[order.sellerId].orderIds.push(order.id);
    }

    const results: any[] = [];
    for (const [sellerId, data] of Object.entries(sellerPayouts)) {
      const seller = data.seller;
      let transactionId = null;
      let notes = `Automated 10-day payout for ${data.orderIds.length} orders`;
      let status = 'COMPLETED';

      // 1. Try RazorpayX if seller has bank details
      if (seller.paymentMethod === 'BANK_TRANSFER' && seller.bankAccount && seller.bankIfsc && seller.bankName) {
        try {
          const contact = await createRazorpayXContact(seller.name, seller.email, seller.id);
          const fundAccount = await createRazorpayXFundAccount(contact.id, seller.bankName, seller.bankAccount, seller.bankIfsc);
          const rzPayout = await createRazorpayXPayout(fundAccount.id, data.amount, `pout_${Date.now()}_${sellerId.substring(0, 5)}`, 'MAGHGO Automated Payout');
          transactionId = rzPayout.id;
          notes += ` | RazorpayX ID: ${transactionId}`;
        } catch (err: any) {
          console.error(`RazorpayX failed for seller ${sellerId}:`, err);
          status = 'FAILED'; // Money wasn't sent, but we still record the attempt
          notes += ` | RazorpayX Error: ${err.message}`;
        }
      } else {
        notes += ` | Skipped automated wire: No valid bank details.`;
        status = 'PENDING'; // Needs manual intervention
      }

      // 2. Database updates
      const payout = await db.$transaction(async (tx) => {
        const p = await tx.payout.create({
          data: {
            sellerId,
            amount: data.amount,
            periodStart: new Date(new Date().setDate(new Date().getDate() - 30)),
            periodEnd: new Date(),
            status,
            notes,
            transactionId,
          }
        });
        
        // Only link orders if payout wasn't a total failure, so they can be picked up again
        if (status !== 'FAILED') {
          await tx.order.updateMany({
            where: { id: { in: data.orderIds } },
            data: { payoutId: p.id }
          });
        }

        // CRITICAL FIX: Deduct balance if money actually left the platform
        if (status === 'COMPLETED') {
          await tx.user.update({
            where: { id: sellerId },
            data: { currentBalance: { decrement: data.amount } }
          });
          
          await tx.walletTransaction.create({
            data: {
              userId: sellerId,
              amount: data.amount,
              type: 'DEBIT',
              description: `Automated Payout via RazorpayX (${transactionId || 'Manual'})`,
              status: 'COMPLETED'
            }
          });
        }

        return p;
      });

      results.push(payout);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (e: any) {
    console.error('Payout Cron Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

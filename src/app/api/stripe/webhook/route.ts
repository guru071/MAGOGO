import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature') as string;

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('STRIPE_WEBHOOK_SECRET is not set, skipping signature verification for local dev');
      event = JSON.parse(body); // only for dev if missing secret
    } else {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    }
  } catch (error: any) {
    console.error(`[stripe] Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // Fulfill wallet deposit
    if (session.metadata?.type === 'wallet_deposit' && session.metadata?.userId) {
      const userId = session.metadata.userId;
      // Stripe amount is in cents, convert back to dollars
      const amount = session.amount_total / 100; 

      try {
        await db.$transaction([
          db.user.update({
            where: { id: userId },
            data: { currentBalance: { increment: amount } }
          }),
          db.walletTransaction.create({
            data: {
              userId,
              amount,
              type: 'CREDIT',
              status: 'COMPLETED',
              description: `Stripe Deposit [ID: ${session.id}]`
            }
          })
        ]);
        console.log(`[stripe] Successfully funded wallet for user ${userId} with $${amount}`);
      } catch (err) {
        console.error('[stripe] Error updating DB after successful payment:', err);
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}

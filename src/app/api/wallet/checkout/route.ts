import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount < 5) {
      return NextResponse.json({ success: false, error: 'Minimum deposit is $5' }, { status: 400 });
    }

    // Amount is in dollars, Stripe requires cents
    const amountInCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MAGHGO Wallet Deposit',
              description: 'Add funds to your MAGHGO wallet to purchase AI prompts',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/wallet?canceled=true`,
      client_reference_id: user.id!.toString(),
      metadata: {
        userId: user.id!.toString(),
        type: 'wallet_deposit'
      }
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('[stripe] checkout error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

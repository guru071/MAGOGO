import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build', {
  apiVersion: '2026-06-24.dahlia' as any,
  appInfo: {
    name: 'MAGHGO Marketplace',
    version: '1.0.0',
  },
});

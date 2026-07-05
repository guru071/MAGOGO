/**
 * Razorpay checkout options shape (subset of the full SDK options).
 * Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
 */
export interface RazorpayOptions {
  key: string
  amount: number
  currency?: string
  name?: string
  description?: string
  image?: string
  order_id: string
  handler: (response: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
    method?: string
  }
  notes?: Record<string, string>
  theme?: { color?: string; hide_topbar?: boolean }
  modal?: {
    ondismiss?: () => void
    confirm_close?: boolean
    animation?: boolean
  }
  retry?: { enabled: boolean }
  [key: string]: unknown
}

/**
 * MAGHGO Razorpay Checkout Configuration
 *
 * Documents what CAN and CANNOT be customized in Razorpay's hosted Checkout UI.
 */

/** Brand assets used across all Razorpay integrations */
export const BRAND = {
  name: 'MAGHGO',
  color: '#2874F0',
  logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
  description: 'Prompt Purchase',
} as const

/**
 * WHAT CAN BE CUSTOMIZED (programmatically via JS SDK options):
 *
 * ┌─────────────────┬──────────────────────────────────────────────────┐
 * │ Option          │ Description                                      │
 * ├─────────────────┼──────────────────────────────────────────────────┤
 * │ name            │ Business name shown in the checkout header       │
 * │ description     │ Short transaction description                    │
 * │ image           │ URL or base64 of your logo (displayed top-left)  │
 * │ theme.color     │ Brand HEX color → affects CTA button, icons,    │
 * │                 │ selected tab underline, and text highlights      │
 * │ prefill.name    │ Auto-fill customer name                          │
 * │ prefill.email   │ Auto-fill customer email                         │
 * │ prefill.contact │ Auto-fill customer phone (boosts conversion)     │
 * │ prefill.method  │ Pre-select a payment method                      │
 * │ modal.ondismiss │ Callback fired when user closes the modal       │
 * │ modal.confirm_close │ Show a confirmation dialog before closing   │
 * │ notes           │ Key-value metadata sent with the order           │
 * │ retry.enabled   │ Let customers retry a failed payment             │
 * └─────────────────┴──────────────────────────────────────────────────┘
 *
 * WHAT CAN BE CUSTOMIZED (persistent via Razorpay Dashboard):
 * ┌─────────────────────┬──────────────────────────────────────────────┐
 * │ Setting             │ Location: Accounts & Settings → Checkout     │
 * │                     │ Styling                                      │
 * ├─────────────────────┼──────────────────────────────────────────────┤
 * │ Brand logo          │ Upload a permanent logo (overrides `image`)  │
 * │ Brand name          │ Display name (must be ≥80% similar to        │
 * │                     │ company/domain name)                         │
 * │ Background colour   │ Checkout background colour                   │
 * │ Font                │ Font family for all checkout text            │
 * │ Border style        │ Border radius of checkout elements           │
 * │ Sidebar graphic     │ Decorative image in desktop sidebar          │
 * │ Trust badge         │ Show/hide "Razorpay Trusted Business" badge │
 * └─────────────────────┴──────────────────────────────────────────────┘
 *
 * WHAT CANNOT BE CUSTOMIZED:
 * - The overall layout, DOM structure, or responsive behaviour of the
 *   checkout overlay (it is Razorpay's hosted page).
 * - Position or sizing of the logo (Razorpay controls the layout grid).
 * - Custom CSS, JavaScript, or HTML injection inside the overlay.
 * - Removing or modifying the Razorpay watermark/footer.
 * - Reordering the payment method list (except pre-selecting one).
 * - Changing the form field labels or adding custom form fields.
 *
 * BEST PRACTICES FOR PROFESSIONAL BRANDING:
 * 1. Always provide `image` (128×128 px or larger, square, PNG/JPEG).
 * 2. Use your brand HEX colour in `theme.color` for visual consistency.
 * 3. Prefill customer name + email + phone to reduce friction.
 * 4. Set a meaningful `description` so the user recognises the purchase.
 * 5. For production, set logo + brand name permanently in the Dashboard
 *    so they appear even if the JS `image` parameter fails to load.
 * 6. Use `retry: { enabled: true }` to recover from transient failures.
 * 7. Avoid generic names like "Test Transaction" in production.
 */

/**
 * Build standard MAGHGO Razorpay checkout options.
 * Call this before initialising `new (window as any).Razorpay(options)`.
 */
export function buildCheckoutOptions(
  overrides: Partial<RazorpayOptions> & {
    key: string
    amount: number
    order_id: string
    handler: (response: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => void
  },
): RazorpayOptions {
  return {
    ...overrides,
    currency: 'INR',
    name: BRAND.name,
    description: BRAND.description,
    image: BRAND.logo,
    prefill: {
      name: overrides.prefill?.name || '',
      email: overrides.prefill?.email || '',
      contact: overrides.prefill?.contact || '',
    },
    theme: {
      color: BRAND.color,
    },
    modal: {
      ondismiss: overrides.modal?.ondismiss || (() => {}),
    },
  }
}

export default BRAND

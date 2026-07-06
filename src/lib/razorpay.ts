import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getINRRate, updateRates } from '@/lib/currencies';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

/** Convert current INR rate to paise (rate * 100) */
function usdToInrPaise(): number {
  return Math.round(getINRRate() * 100);
}

/** Refresh live rates from the exchange rate API */
export async function refreshRate(): Promise<number> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        updateRates(data.rates);
      }
    }
  } catch {}
  return usdToInrPaise();
}

function getInstance(): Razorpay | null {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

export function isConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

/** Convert USD amount to INR paise (uses live rate) */
export function usdToPaise(usd: number): number {
  return Math.round(usd * getINRRate() * 100);
}

/** Convert INR paise to USD */
export function paiseToUsd(paise: number): number {
  return paise / (getINRRate() * 100);
}

/** Create a Razorpay order */
export async function createOrder(amountUsd: number, receipt: string, notes: Record<string, string> = {}) {
  const instance = getInstance();
  if (!instance) throw new Error('Razorpay not configured');

  await refreshRate();

  return instance.orders.create({
    amount: usdToPaise(amountUsd),
    currency: 'INR',
    receipt,
    notes,
  });
}

/** Verify Razorpay payment signature using HMAC-SHA256 */
export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
    
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

/** Fetch a payment by ID */
export async function fetchPayment(paymentId: string) {
  const instance = getInstance();
  if (!instance) throw new Error('Razorpay not configured');
  return instance.payments.fetch(paymentId);
}

/** Initiate a refund */
export async function refundPayment(paymentId: string, amountUsd?: number) {
  const instance = getInstance();
  if (!instance) throw new Error('Razorpay not configured');
  const body: any = {};
  if (amountUsd) body.amount = usdToPaise(amountUsd);
  return instance.payments.refund(paymentId, body);
}

// --- RazorpayX Payouts ---

function getRazorpayXHeaders() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('Razorpay not configured');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
  };
}

export async function createRazorpayXContact(name: string, email: string, referenceId: string) {
  const res = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: getRazorpayXHeaders(),
    body: JSON.stringify({ name, email, reference_id: referenceId, type: 'vendor' })
  });
  const data = await res.json();
  if (data.error) throw new Error(`RazorpayX Contact Error: ${data.error.description}`);
  return data;
}

export async function createRazorpayXFundAccount(contactId: string, name: string, bankAccount: string, bankIfsc: string) {
  const res = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: getRazorpayXHeaders(),
    body: JSON.stringify({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: { name, ifsc: bankIfsc, account_number: bankAccount }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(`RazorpayX Fund Account Error: ${data.error.description}`);
  return data;
}

export async function createRazorpayXPayout(fundAccountId: string, amountUsd: number, referenceId: string, notes: string = '') {
  const RAZORPAYX_ACCOUNT_NUMBER = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!RAZORPAYX_ACCOUNT_NUMBER) throw new Error('RAZORPAYX_ACCOUNT_NUMBER env var is required for automated payouts');

  const res = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: getRazorpayXHeaders(),
    body: JSON.stringify({
      account_number: RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: usdToPaise(amountUsd),
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: referenceId,
      notes: { desc: notes }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(`RazorpayX Payout Error: ${data.error.description}`);
  return data;
}

export { RAZORPAY_KEY_ID };
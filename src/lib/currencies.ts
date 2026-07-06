/**
 * Centralized currency configuration — SINGLE SOURCE OF TRUTH.
 *
 * All exchange rates, symbols, and currency metadata live here.
 * Every other file in the project must import from this file.
 * Never hardcode currency symbols ('$') or rates (94.6) anywhere else.
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;   // 1 USD = rate units of this currency
  flag: string;
}

/** Master list of supported currencies. USD is always base (rate=1). */
export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar',          rate: 1,     flag: '🇺🇸' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee',       rate: 94.6,  flag: '🇮🇳' },
  { code: 'EUR', symbol: '€',  name: 'Euro',               rate: 0.89,  flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',      rate: 0.75,  flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',   rate: 1.55,  flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',    rate: 1.38,  flag: '🇨🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',        rate: 3.67,  flag: '🇦🇪' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',       rate: 144.0, flag: '🇯🇵' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',      rate: 5.65,  flag: '🇧🇷' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',     rate: 1620,  flag: '🇳🇬' },
];

/** Currencies that should not show decimal places */
const NO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'NGN']);

// ────────────────────────────────────────────────────────────────
// Server-side helpers (safe for API routes, no window dependency)
// ────────────────────────────────────────────────────────────────

/** Look up a currency by code, defaulting to USD. */
export function getCurrency(code?: string | null): Currency {
  if (!code) return CURRENCIES[0];
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

/** Get the symbol for a currency code, defaulting to '$'. */
export function getSymbol(code?: string | null): string {
  return getCurrency(code).symbol;
}

/** Get the exchange rate for a currency code, defaulting to 1 (USD). */
export function getRate(code?: string | null): number {
  return getCurrency(code).rate;
}

/** Format a USD amount in the given currency. For server-side / admin use. */
export function formatAmount(usdAmount: number, currencyCode?: string): string {
  const cur = getCurrency(currencyCode);
  const converted = usdAmount * cur.rate;
  if (NO_DECIMAL_CURRENCIES.has(cur.code)) {
    return `${cur.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${cur.symbol}${converted.toFixed(2)}`;
}

/** Shortcut: format as USD specifically (admin dashboard default). */
export function formatUSD(amount: number): string {
  return formatAmount(amount, 'USD');
}

// ────────────────────────────────────────────────────────────────
// Rate update helpers
// ────────────────────────────────────────────────────────────────

/** Get the INR rate (used by Razorpay integration). */
export function getINRRate(): number {
  return getRate('INR');
}

/** Build a plain rates map for the exchange-rates API fallback. */
export function getFallbackRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const c of CURRENCIES) {
    rates[c.code] = c.rate;
  }
  return rates;
}

/** Update rates from a live API response (mutates the CURRENCIES array in place). */
export function updateRates(liveRates: Record<string, number>): void {
  for (const cur of CURRENCIES) {
    if (liveRates[cur.code] !== undefined) {
      cur.rate = liveRates[cur.code];
    }
  }
}
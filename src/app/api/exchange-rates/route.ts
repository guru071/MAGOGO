import { NextResponse } from 'next/server';

// Cache exchange rates for 1 hour
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  INR: 94.6,
  EUR: 0.89,
  GBP: 0.75,
  AUD: 1.55,
  CAD: 1.38,
  AED: 3.67,
  JPY: 144.0,
  BRL: 5.65,
  NGN: 1620,
};

export async function GET() {
  try {
    const now = Date.now();

    // Return cached rates if still fresh
    if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({ success: true, data: cachedRates, cached: true });
    }

    // Fetch live rates from free API (no API key needed)
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      throw new Error('Exchange rate API returned non-OK status');
    }

    const data = await res.json();
    const rates: Record<string, number> = {};

    for (const code of Object.keys(FALLBACK_RATES)) {
      rates[code] = data.rates?.[code] ?? FALLBACK_RATES[code];
    }

    // Cache the rates
    cachedRates = rates;
    cacheTimestamp = now;

    return NextResponse.json({ success: true, data: rates, cached: false });
  } catch (error: any) {
    console.error('[API] GET /api/exchange-rates error:', error.message);
    // Return fallback rates on error
    return NextResponse.json({ success: true, data: FALLBACK_RATES, cached: false, fallback: true });
  }
}

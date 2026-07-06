import { NextResponse } from 'next/server';
import { getFallbackRates, updateRates } from '@/lib/currencies';

// Cache exchange rates for 1 hour
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES = getFallbackRates();

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

    // Update the centralized CURRENCIES array with live rates
    updateRates(rates);

    // Cache the rates
    cachedRates = rates;
    cacheTimestamp = now;

    return NextResponse.json({ success: true, data: rates, cached: false });
  } catch {
    console.error('[API] GET /api/exchange-rates error');
    // Return fallback rates on error
    return NextResponse.json({ success: true, data: FALLBACK_RATES, cached: false, fallback: true });
  }
}
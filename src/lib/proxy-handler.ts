import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const ipBlacklist = new Map<string, { reason: string; blockedAt: string }>();
const DEFAULT_LIMIT = 100;
const ADMIN_LIMIT = 30;
const WINDOW_MS = 60_000;

const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /dirbuster/i,
  /gobuster/i, /wfuzz/i, /hydra/i, /burpsuite/i, /zgrab/i,
  /httpx/i, /subfinder/i, /nuclei/i, /scrapy/i,
];

function isSuspiciousUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return SUSPICIOUS_UA_PATTERNS.some((p) => p.test(ua));
}

function extractIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function middleware(request: NextRequest) {
  const ip = extractIP(request);
  const ua = request.headers.get('user-agent') || null;
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/api/admin/');

  // 1. Block blacklisted IPs
  if (ipBlacklist.has(ip)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Forbidden: IP blocked' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Block suspicious User-Agents on API routes
  if (pathname.startsWith('/api/') && isSuspiciousUserAgent(ua)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Forbidden: suspicious request' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const limit = isAdminRoute ? ADMIN_LIMIT : DEFAULT_LIMIT;
    const now = Date.now();
    let entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      rateLimitMap.set(ip, entry);
    }

    entry.count++;

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      const response = NextResponse.json(
        { success: false, error: 'Too Many Requests' },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(retryAfter));
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    const supabase = createSupabaseMiddlewareClient(request, response);
    await supabase.auth.getUser();
    return applySecurityHeaders(response);
  }

  // 4. Refresh Supabase session on all other routes (keeps cookies in sync)
  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  await supabase.auth.getUser();
  return applySecurityHeaders(response);
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${supabaseUrl} https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com; font-src 'self' data:; connect-src 'self' ws: wss: ${supabaseUrl} https://api.razorpay.com; frame-src 'self' https://api.razorpay.com;`
  );
  return response;
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/')
}

const SUSPICIOUS_PATTERNS = [
  /['"]--/,
  /(?:UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s/i,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /\.\.\/\.\.\//,
  /\/etc\/passwd/,
  /\/proc\/self/,
  /exec\s*\(/i,
  /system\s*\(/i,
  /eval\s*\(/i,
  /char\s*\(/i,
]

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  if (isApiRoute(pathname)) {
    const ip = getClientIp(request)

    // --- Rate limiting ---
    const limit = isAuthRoute(pathname) ? 20 : 100
    const windowMs = 60_000
    const now = Date.now()

    let entry = rateLimitMap.get(ip)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      rateLimitMap.set(ip, entry)
    }
    entry.count++

    if (entry.count > limit) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)))
    response.headers.set('X-RateLimit-Reset', String(entry.resetAt))

    // --- Block suspicious patterns in query params ---
    const search = request.nextUrl.search
    if (search) {
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(search)) {
          console.warn(`[middleware] Blocked suspicious request from ${ip}: ${pathname}${search}`)
          return new NextResponse(JSON.stringify({ success: false, error: 'Bad request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // --- CSRF check for state-changing requests on auth routes ---
    if (isAuthRoute(pathname) && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.NEXT_PUBLIC_BASE_PATH,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'capacitor://localhost',
        'https://maghgo.com',
      ].filter(Boolean) as string[]

      const isValidOrigin = origin && allowedOrigins.some(a => origin.startsWith(a))
      const isValidReferer = referer && allowedOrigins.some(a => referer.startsWith(a))

      if (!isValidOrigin && !isValidReferer) {
        console.warn(`[middleware] CSRF check failed for ${pathname} from origin: ${origin}, referer: ${referer}`)
        return new NextResponse(JSON.stringify({ success: false, error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  }

  // --- Security Headers ---
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://*.cloudinary.com https://via.placeholder.com https://api.dicebear.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.exchangerate-api.com https://api-inference.huggingface.co https://api.razorpay.com",
    "frame-src 'self' https://checkout.razorpay.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)'],
}

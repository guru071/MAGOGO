import type { NextRequest } from 'next/server';
import { middleware } from './lib/proxy-handler';

export function proxy(request: NextRequest) {
  return middleware(request);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
  ],
};

import { db } from '@/lib/db';
import { loginWithSupabase } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isIPBlacklisted, blockIP, createAuditLog } from '@/lib/security';

function parseUserAgent(ua: string | null) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' };
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  let device = 'Desktop';
  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
  return { device, browser };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'Unknown';

    if (isIPBlacklisted(ip)) {
      return NextResponse.json({ success: false, error: 'Too many failed attempts. Your IP has been temporarily blocked.' }, { status: 403 });
    }

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const ipFailedCount = await db.loginHistory.count({
        where: { ipAddress: ip, status: 'FAILED', createdAt: { gte: oneHourAgo } },
      });
      if (ipFailedCount > 10) {
        blockIP(ip, `Auto-banned: ${ipFailedCount} failed login attempts in 1 hour`);
        return NextResponse.json({ success: false, error: 'Too many failed attempts. Your IP has been blocked.' }, { status: 403 });
      }
    } catch (e) { console.error('[auth/login] IP rate check error', e); /* DB unavailable — skip IP rate check */ }

    const ua = req.headers.get('user-agent') || null;
    const { device, browser } = parseUserAgent(ua);

    try {
      const { session, user, profile } = await loginWithSupabase(email, password);

      // Check email verification
      if (!user.email_confirmed_at) {
        const supabase = await createSupabaseServerClient()
        await supabase.auth.signOut()
        try {
          await db.loginHistory.create({
            data: { userId: profile.id, ipAddress: ip, userAgent: ua || undefined, device, browser, status: 'FAILED' },
          });
        } catch (e) { console.error('[auth/login] failed login history create error', e); }
        return NextResponse.json({ success: false, error: 'EMAIL_NOT_VERIFIED' }, { status: 403 });
      }

      try {
        await db.loginHistory.create({
          data: { userId: profile.id, ipAddress: ip, userAgent: ua || undefined, device, browser, status: 'SUCCESS' },
        });
        await createAuditLog({ userId: profile.id, action: 'LOGIN', details: `User logged in successfully from ${browser} on ${device}`, ipAddress: ip });
      } catch (e) { console.error('[auth/login] login history create error', e); /* DB unavailable — skip logging */ }

      return NextResponse.json({ success: true, data: { user: profile, supabaseSession: session } });
    } catch (err: unknown) {
      console.error('LOGIN ERROR DETAILS:', err);
      try {
        await db.loginHistory.create({
          data: { userId: null, ipAddress: ip, userAgent: ua || undefined, device, browser, status: 'FAILED' },
        });
      } catch (e2) { console.error('[auth/login] failed login history create error', e2); /* DB unavailable — skip logging */ }
      const error = err as { message?: string };
      const message = typeof error.message === 'string' && error.message.toLowerCase().includes('suspended')
        ? error.message
        : 'Invalid email or password';
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
  } catch (e) {  
    console.error('OUTER LOGIN ERROR:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); 
  }
}

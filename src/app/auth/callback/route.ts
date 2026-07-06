import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/';

    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
      console.error('[auth/callback] code exchange error:', error.message);
    }

    return NextResponse.redirect(new URL('/?error=auth_failed', origin));
  } catch (e) {
    console.error('[auth/callback]', e);
    return NextResponse.redirect(new URL('/?error=callback_failed', req.url));
  }
}

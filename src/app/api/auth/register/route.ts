import { signupWithSupabase } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, country } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, password, and name required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { user, profile } = await signupWithSupabase(email, password, name, country);

    // Send Welcome Email
    import('@/lib/email').then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail(profile.email, profile.name).catch(e => console.error('[email] register failed', e));
    });

    return NextResponse.json({
      success: true,
      data: { user: profile, supabaseUser: user, needsEmailConfirmation: !user.email_confirmed_at },
    });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 400 });
  }
}

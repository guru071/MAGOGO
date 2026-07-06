import { db } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    let supabaseUserId: string | undefined;

    // Check Authorization header first (preferred), then fall back to cookie-based session
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const adminClient = createSupabaseAdminClient();
      const { data: { user } } = await adminClient.auth.getUser(token);
      if (user) supabaseUserId = user.id;
    }

    if (!supabaseUserId) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) supabaseUserId = user.id;
    }

    if (!supabaseUserId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    let profile;
    try {
      profile = await db.user.findUnique({ where: { authUserId: supabaseUserId } });
    } catch (e) { console.error('[auth/me] DB fetch error', e); }

    if (!profile) {
      const supabase = await createSupabaseServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        profile = await db.user.upsert({
          where: { email: authUser.email },
          update: { authUserId: supabaseUserId },
          create: {
            authUserId: supabaseUserId,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
            role: 'BUYER',
          },
        });
      } else {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

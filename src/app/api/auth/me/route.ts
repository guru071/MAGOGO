import { db } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get('token');

    let supabaseUserId: string | undefined;

    if (tokenParam) {
      const adminClient = createSupabaseAdminClient();
      const { data: { user } } = await adminClient.auth.getUser(tokenParam);
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
    } catch (e) { console.error('[auth/me] DB fetch error', e); /* DB unavailable */ }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 1. Unconditionally clear all cookies first
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        cookieStore.delete(cookie.name);
      }
    }

    // 2. Try to tell supabase to invalidate the session on their end
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (e) { 
      console.error("Supabase signOut error, continuing anyway:", e); 
    }

    return NextResponse.json({ success: true });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

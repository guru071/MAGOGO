import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/security'
import { isIPBlacklisted } from '@/lib/security'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      const user = session.user
      
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'Unknown';
      if (isIPBlacklisted(ip)) {
        return NextResponse.redirect(`${origin}/?error=ip-blocked`)
      }

      // Check if user exists in DB
      let profile = await db.user.findUnique({ where: { authUserId: user.id } })
      
      // If not, create them
      if (!profile) {
        profile = await db.user.create({
          data: {
            authUserId: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || null,
            country: 'USA'
          }
        })
        await createAuditLog({ userId: profile.id, action: 'OAUTH_REGISTER', details: `User registered via Google OAuth`, ipAddress: ip });
      } else {
        await createAuditLog({ userId: profile.id, action: 'LOGIN', details: `User logged in via Google OAuth`, ipAddress: ip });
      }
      
      // Login history
      try {
        await db.loginHistory.create({
          data: { userId: profile.id, ipAddress: ip, status: 'SUCCESS' },
        });
      } catch {}

      // Successful auth, redirect to home
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Return user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth-failed`)
}

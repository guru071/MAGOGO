import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // The redirect to the next route after successful login
  const next = requestUrl.searchParams.get('next') ?? '/'
  
  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData.user) {
      // Sync the user to Prisma SQLite database
      const user = authData.user
      const email = user.email!
      
      try {
        await prisma.user.upsert({
          where: { email: email },
          update: {
            authUserId: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || null,
          },
          create: {
            authUserId: user.id,
            email: email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || null,
          }
        })
      } catch (dbError) {
        console.error("Failed to sync user to local database:", dbError)
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=Could not authenticate user', requestUrl.origin))
}

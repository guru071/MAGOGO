import { createSupabaseAdminClient } from './supabase-admin'
import { createSupabaseServerClient } from './supabase-server'
import { db } from './db'

export async function signupWithSupabase(email: string, password: string, name: string, country: string = 'INDIA') {
  // First check if local profile already exists
  const existingLocal = await db.user.findUnique({ where: { email } })
  if (existingLocal) {
    throw new Error('A user with this email address has already been registered')
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) {
    // User exists in Supabase Auth but not in our DB (from prior failed attempts)
    if (error.message.includes('already been registered')) {
      // Sign in to get the existing Supabase user, then create local profile
      const supabase = await createSupabaseServerClient()
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password })
      if (signInData?.user) {
        const profile = await db.user.create({
          data: {
            authUserId: signInData.user.id,
            email,
            name,
            country,
            role: 'BUYER',
          },
        })
        return { user: signInData.user, profile }
      }
    }
    throw new Error(error.message)
  }
  if (!data.user) throw new Error('Signup failed')

  const profile = await db.user.create({
    data: {
      authUserId: data.user.id,
      email,
      name,
      country,
      role: 'BUYER',
    },
  })
  return { user: data.user, profile }
}

export async function loginWithSupabase(email: string, password: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Login failed')

  let profile = await db.user.findUnique({ where: { authUserId: data.user.id } })
  if (!profile) {
    profile = await db.user.create({
      data: {
        authUserId: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
        role: 'BUYER',
      },
    })
  }

  if (!profile.isActive || profile.isBanned) {
    await supabase.auth.signOut()
    throw new Error('Your account has been suspended. Contact support for access.')
  }

  await db.user.update({
    where: { id: profile.id },
    data: { lastLoginAt: new Date(), isOnline: true },
  })
  return { session: data.session, user: data.user, profile }
}

export async function getSupabaseSession() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signOutFromSupabase() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const profile = await db.user.findUnique({
    where: { authUserId: data.user.id },
    select: {
      id: true, authUserId: true, email: true, name: true, avatar: true,
      role: true, isSeller: true, bio: true, totalEarnings: true,
      currentBalance: true, totalSpent: true, isVerified: true, isActive: true, isBanned: true,
    },
  })
  return profile
}

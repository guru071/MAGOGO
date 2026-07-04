import { createSupabaseServerClient } from './supabase-server'
import { db } from './db'
import type { User } from '@prisma/client'

export async function getCurrentUser(): Promise<Partial<User> | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await db.user.findUnique({
    where: { authUserId: user.id },
    select: {
      id: true, authUserId: true, email: true, name: true, avatar: true,
      role: true, isSeller: true, bio: true, totalEarnings: true,
      currentBalance: true, totalSpent: true, isVerified: true, isActive: true, isBanned: true,
    },
  })
  return profile
}

export async function requireUser(): Promise<Partial<User>> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(): Promise<Partial<User>> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new Error('Forbidden: Admin only')
  return user
}

export function getSupabaseSessionToken(token: string): { userId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return { userId: payload.sub }
  } catch (e) {
    console.error('[auth-helpers] JWT parse error', e)
    return null
  }
}

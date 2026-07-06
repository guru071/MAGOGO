import { createSupabaseServerClient } from './supabase-server'
import { db } from './db'
import type { User } from '@prisma/client'

export type AuthedUser = {
  id: string;
  authUserId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: string;
  isSeller: boolean;
  bio: string | null;
  totalEarnings: number;
  currentBalance: number;
  totalSpent: number;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
};

export async function getCurrentUser(): Promise<AuthedUser | null> {
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
  return profile as AuthedUser | null
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(): Promise<AuthedUser> {
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

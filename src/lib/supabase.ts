import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'
import { createSupabaseBrowserClient } from './supabase-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

export {
  createSupabaseServerClient as getSupabaseServerClient,
  createSupabaseBrowserClient as getSupabaseBrowserClient,
}

export const TABLES = {
  USERS: 'users',
  PROMPTS: 'prompts',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  PAYOUTS: 'payouts',
  COUPONS: 'coupons',
  ACTIVITY_LOGS: 'activity_logs',
  SETTINGS: 'platform_settings',
} as const

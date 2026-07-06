import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { token, platform } = await req.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    // Token acknowledged. For production, add a DeviceToken model to Prisma
    // and store tokens for push notification delivery.
    console.log(`[device-token] User ${user.id} registered ${platform} token: ${token.substring(0, 20)}...`)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[device-token] error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getFeeConfig, DEFAULT_FEE_CONFIG, calculateFees } from '@/lib/fees'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const config = await getFeeConfig()
    return NextResponse.json({ success: true, data: config })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const config = { ...DEFAULT_FEE_CONFIG, ...body }
    await db.platformSettings.upsert({
      where: { key: 'fee_config' },
      update: { value: JSON.stringify(config) },
      create: { key: 'fee_config', value: JSON.stringify(config) },
    })
    return NextResponse.json({ success: true, data: config })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}

// Preview fee calculation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { amount, config } = await req.json()
    const feeConfig = config || await getFeeConfig()
    const breakdown = calculateFees(amount || 0, feeConfig)
    return NextResponse.json({ success: true, data: breakdown })
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

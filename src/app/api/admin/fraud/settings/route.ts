import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const settings = await db.platformSettings.findFirst({ where: { key: 'fraud_config' } })
    const config = settings?.value ? JSON.parse(settings.value as string) : {
      userRiskThreshold: 70,
      promptRiskThreshold: 60,
      reviewRiskThreshold: 65,
      transactionRiskThreshold: 75,
      autoBlockThreshold: 90,
      enabled: true,
      notifyOnFlag: true,
    }
    return NextResponse.json({ success: true, data: config })
  } catch (e) {
    console.error('[admin/fraud/settings] GET error', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch fraud settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    await db.platformSettings.upsert({
      where: { key: 'fraud_config' },
      update: { value: JSON.stringify(body.config) },
      create: { key: 'fraud_config', value: JSON.stringify(body.config) },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/fraud/settings] PUT error', e);
    return NextResponse.json({ success: false, error: 'Failed to update fraud settings' }, { status: 500 })
  }
}

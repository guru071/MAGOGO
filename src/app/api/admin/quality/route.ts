import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const settings = await db.platformSettings.findFirst({ where: { key: 'quality_config' } })
    const config = settings?.value ? JSON.parse(settings.value as string) : {
      autoApproveThreshold: 80,
      autoRejectThreshold: 20,
      enabled: true,
      notifyOnLowQuality: true,
      dimensions: ['clarity', 'specificity', 'creativity', 'usability', 'engagement', 'originality', 'formatting', 'relevance'],
    }
    return NextResponse.json({ success: true, data: config })
  } catch { return NextResponse.json({ success: false, error: 'Failed to load' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    await db.platformSettings.upsert({
      where: { key: 'quality_config' },
      update: { value: JSON.stringify(body.config) },
      create: { key: 'quality_config', value: JSON.stringify(body.config) },
    })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 }) }
}

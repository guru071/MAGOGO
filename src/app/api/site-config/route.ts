import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_CONFIG = {
  banners: [],
  offers: [],
  featuredPromptIds: [],
  categories: [],
  siteSettings: {
    siteName: 'MAGHGO',
    tagline: 'Premium AI Prompts Marketplace',
    primaryColor: '#2874F0',
    accentColor: '#FF9F00',
    announcement: null,
  },
}

export async function GET() {
  try {
    let config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    if (!config) {
      config = await db.siteConfig.create({
        data: { id: 'default', data: DEFAULT_CONFIG },
      })
    }
    return NextResponse.json({ success: true, data: config.data })
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const config = await db.siteConfig.upsert({
      where: { id: 'default' },
      update: { data: body },
      create: { id: 'default', data: body },
    })
    return NextResponse.json({ success: true, data: config.data })
  } catch (e: any) { 
    const status = e.message === 'Unauthorized' ? 401 : e.message === 'Forbidden: Admin only' ? 403 : 500
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status })
  }
}

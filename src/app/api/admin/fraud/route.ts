import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { type: 'FRAUD' }
    if (status !== 'all') where.status = status

    const [cases, total] = await Promise.all([
      db.securityCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      db.securityCase.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { cases, total, page, totalPages: Math.ceil(total / limit) } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch fraud cases' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { caseId, action, resolution } = await req.json()

    if (action === 'block_user') {
      const fraudCase = await db.securityCase.findUnique({ where: { id: caseId } })
      if (fraudCase) {
        await db.user.update({ where: { id: fraudCase.userId }, data: { isBanned: true } })
      }
    }

    await db.securityCase.update({
      where: { id: caseId },
      data: { status: 'RESOLVED', resolution: resolution || 'Reviewed and resolved' },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update fraud case' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const transactions = await db.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, data: { transactions } })
  } catch (err: any) {
    console.error('Wallet fetch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

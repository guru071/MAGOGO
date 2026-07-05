import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/razorpay'
import { getUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()
    if (!amount || amount <= 0 || amount > 10000) {
      return NextResponse.json({ success: false, error: 'Invalid amount. Maximum top-up is $10,000' }, { status: 400 })
    }

    const order = await createOrder(amount, `wallet_topup_${user.id}`, { userId: user.id })
    return NextResponse.json({ success: true, orderId: order.id, amountUsd: amount })
  } catch (err: any) {
    console.error('Wallet Topup Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

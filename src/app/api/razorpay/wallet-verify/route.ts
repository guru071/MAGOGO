import { NextResponse } from 'next/server'
import { verifyPayment, fetchPayment, paiseToUsd } from '@/lib/razorpay'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json()
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // Check idempotency - prevent replay attacks
    const existingTxn = await db.walletTransaction.findUnique({
      where: { paymentId: razorpayPaymentId }
    })
    
    if (existingTxn) {
      return NextResponse.json({ success: true, message: 'Payment already processed' })
    }

    // Fetch actual amount from Razorpay
    const payment = await fetchPayment(razorpayPaymentId)
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ success: false, error: 'Payment not captured' }, { status: 400 })
    }
    
    // amount in Razorpay is in paise (or cents depending on currency, assuming INR paise)
    const actualAmountUsd = paiseToUsd(payment.amount as number)

    // Process top-up atomically
    await db.$transaction(async (tx) => {
      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: actualAmountUsd,
          type: 'CREDIT',
          paymentId: razorpayPaymentId,
          description: `Wallet Top-up via Razorpay (${razorpayPaymentId})`,
          status: 'COMPLETED'
        }
      })
      
      // Update user balance
      await tx.user.update({
        where: { id: user.id },
        data: { currentBalance: { increment: actualAmountUsd } }
      })
    })

    return NextResponse.json({ success: true, message: 'Wallet topped up successfully', amountUsd: actualAmountUsd })
  } catch (err: any) {
    console.error('Wallet Verify Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}


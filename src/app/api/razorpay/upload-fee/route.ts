import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/razorpay'
import { getUser } from '@/lib/auth'
import { getFeeConfig, calculateFees } from '@/lib/fees'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { amount, promptLength, categoryId } = await req.json()
    
    let categoryName: string | undefined = undefined;
    if (categoryId) {
      const cat = await db.category.findUnique({ where: { id: categoryId } });
      if (cat) categoryName = cat.name;
    }

    const feeConfig = await getFeeConfig()
    const feeBreakdown = calculateFees(amount, feeConfig, promptLength, categoryName)
    const totalFees = feeBreakdown.totalFees

    if (totalFees <= 0) {
      return NextResponse.json({ success: false, error: 'No fee required' }, { status: 400 })
    }

    const order = await createOrder(totalFees, `upload_fee_${user.id}`, { userId: user.id, feeType: 'upload' })
    return NextResponse.json({ success: true, orderId: order.id, feeUsd: totalFees })
  } catch (err: any) {
    console.error('Upload Fee Razorpay Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

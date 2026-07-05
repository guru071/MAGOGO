import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { createOrder, isConfigured } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    if (!isConfigured()) {
      return NextResponse.json({ success: false, error: 'Razorpay is not configured on this server.' }, { status: 500 });
    }

    const { promptIds, couponCode } = await req.json();
    
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No prompts provided' }, { status: 400 });
    }

    let totalAmount = 0;
    
    // Calculate total amount
    for (const promptId of promptIds) {
      const prompt = await db.prompt.findUnique({ 
        where: { id: promptId }
      });
      
      if (!prompt || prompt.status !== 'APPROVED') {
        return NextResponse.json({ success: false, error: `Prompt ${promptId} is not available` }, { status: 404 });
      }
      
      if (prompt.sellerId === user.id) {
        return NextResponse.json({ success: false, error: 'Cannot buy your own prompt' }, { status: 400 });
      }

      const existing = await db.order.findFirst({ where: { buyerId: user.id, promptId, status: 'COMPLETED' } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'You have already purchased one of these prompts' }, { status: 400 });
      }

      let amount = prompt.isFree ? 0 : prompt.price;
      
      if (couponCode && amount > 0) {
        const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || coupon.expiresAt > new Date()) && amount >= coupon.minAmount) {
          const discountAmt = amount * coupon.discount / 100;
          amount -= discountAmt;
        }
      }
      
      totalAmount += amount;
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Total amount must be greater than 0 for Razorpay checkout' }, { status: 400 });
    }

    // Create Razorpay order
    const rzOrder = await createOrder(
      totalAmount,
      `bulk_${user.id.substring(0, 8)}_${Date.now()}`,
      {
        userId: user.id,
        promptCount: promptIds.length.toString()
      }
    );

    return NextResponse.json({ 
      success: true, 
      orderId: rzOrder.id,
      amount: totalAmount
    });
    
  } catch (e: any) { 
    console.error('[checkout/razorpay]', e);
    return NextResponse.json({ success: false, error: e.message || 'Failed to create order' }, { status: 500 }); 
  }
}

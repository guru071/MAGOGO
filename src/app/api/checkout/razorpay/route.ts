import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { createOrder, isConfigured } from '@/lib/razorpay';
import { getFeeConfig, calculateFees } from '@/lib/fees';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    if (!isConfigured()) {
      return NextResponse.json({ success: false, error: 'Razorpay is not configured on this server.' }, { status: 500 });
    }

    const { promptIds, couponCode } = await req.json();
    
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No prompts provided' }, { status: 400 });
    }

    let totalAmount = 0;
    const feeConfig = await getFeeConfig();
    const orderItems: any[] = [];
    
    // Calculate total amount and fee breakdowns
    for (const promptId of promptIds) {
      const prompt = await db.prompt.findUnique({ 
        where: { id: promptId },
        include: { category: true }
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

      const feeBreakdown = calculateFees(amount, feeConfig, prompt.promptText.length, prompt.category?.name);
      
      orderItems.push({
        promptId,
        sellerId: prompt.sellerId,
        amount,
        feeBreakdown,
        couponCode: couponCode || null,
      });
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

    // CRITICAL SECURITY FIX: Create PENDING orders in the database linked to the Razorpay Order ID.
    // This prevents malicious users from swapping promptIds during the verification step.
    const pendingOrders = await db.$transaction(async (tx) => {
      const created: any[] = [];
      for (const item of orderItems) {
        const order = await tx.order.create({
          data: {
            orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            buyerId: user.id!,
            promptId: item.promptId,
            sellerId: item.sellerId,
            amount: item.amount,
            platformFee: item.feeBreakdown.totalFees,
            sellerAmount: item.feeBreakdown.netAmount,
            commissionRate: item.feeBreakdown.commissionRate,
            commissionAmt: item.feeBreakdown.commissionAmt,
            gstRate: item.feeBreakdown.gstRate,
            gstAmt: item.feeBreakdown.gstAmt,
            closingFee: item.feeBreakdown.closingFee,
            paymentFeeRate: item.feeBreakdown.paymentFeeRate,
            paymentFeeAmt: item.feeBreakdown.paymentFeeAmt,
            totalFees: item.feeBreakdown.totalFees,
            netAmount: item.feeBreakdown.netAmount,
            paymentMethod: 'RAZORPAY',
            paymentId: rzOrder.id,
            currency: 'USD',
            status: 'PENDING',
            couponCode: item.couponCode,
          }
        });
        created.push(order);
      }
      return created;
    });

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

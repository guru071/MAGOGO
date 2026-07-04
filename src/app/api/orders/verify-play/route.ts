import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@prisma/client';

async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<{ valid: boolean; orderId?: string; purchaseTime?: number }> {
  const clientEmail = process.env.GOOGLE_PLAY_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PLAY_PRIVATE_KEY;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson && (!clientEmail || !privateKey)) {
    return { valid: false };
  }

  try {
    let accessToken: string;

    if (serviceAccountJson) {
      const svc = JSON.parse(serviceAccountJson);
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        credentials: svc,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      accessToken = token.token!;
    } else {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey!.replace(/\\n/g, '\n') },
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
      const client = await auth.getClient();
      const tokenRes = await client.getAccessToken();
      accessToken = tokenRes.token!;
    }

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Play Store] Verification failed:', res.status, errText);
      return { valid: false };
    }

    const data = await res.json();
    const purchaseState = data.purchaseState; // 0 = purchased, 1 = cancelled, 2 = pending
    const consumptionState = data.consumptionState; // 0 = yet to be consumed, 1 = consumed

    return {
      valid: purchaseState === 0 && consumptionState === 0,
      orderId: data.orderId,
      purchaseTime: data.purchaseTimeMillis ? parseInt(data.purchaseTimeMillis) : undefined,
    };
  } catch (e) {
    console.error('[Play Store] Verification error:', e);
    return { valid: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { packageName, productId, purchaseToken, promptIds } = await req.json();
    if (!packageName || !productId || !purchaseToken || !promptIds?.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await verifyWithGooglePlay(packageName, productId, purchaseToken);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Play Store purchase verification failed. Ensure the purchase token is valid and the product has not been consumed.' }, { status: 400 });
    }

    const prompts = await db.prompt.findMany({
      where: { id: { in: promptIds }, status: 'APPROVED' },
      include: { category: true }
    });
    if (prompts.length !== promptIds.length) {
      return NextResponse.json({ success: false, error: 'One or more prompts not found or unavailable' }, { status: 404 });
    }

    // Check for self-purchases and duplicates
    for (const p of prompts) {
      if (p.sellerId === user.id!) {
        return NextResponse.json({ success: false, error: 'Cannot buy own prompt' }, { status: 400 });
      }
      const existing = await db.order.findFirst({ where: { buyerId: user.id!, promptId: p.id, status: 'COMPLETED' } });
      if (existing) {
        return NextResponse.json({ success: false, error: `Already purchased: ${p.title}` }, { status: 400 });
      }
    }

    // Get full fee config for consistent calculations
    const { getFeeConfig, calculateFees } = await import('@/lib/fees');
    const feeConfig = await getFeeConfig();

    const orders = await db.$transaction(async (tx) => {
      const createdOrders: Order[] = [];
      let totalAmount = 0;
      
      for (const p of prompts) {
        const amount = p.isFree ? 0 : p.price;
        const feeBreakdown = calculateFees(amount, feeConfig, undefined, p.category?.name);
        
        const order = await tx.order.create({
          data: {
            orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            buyerId: user.id!,
            promptId: p.id,
            sellerId: p.sellerId,
            amount,
            platformFee: 0,
            sellerAmount: amount,
            commissionRate: 0,
            commissionAmt: 0,
            gstRate: 0,
            gstAmt: 0,
            closingFee: 0,
            paymentFeeRate: 0,
            paymentFeeAmt: 0,
            totalFees: 0,
            netAmount: amount,
            paymentMethod: 'GOOGLE_PLAY',
            currency: 'USD',
            status: 'COMPLETED',
          },
        });
        
        // Create platform revenue record
        await tx.platformRevenue.create({
          data: {
            orderId: order.id,
            commission: feeBreakdown.commissionAmt,
            gst: feeBreakdown.gstAmt,
            closingFee: feeBreakdown.closingFee,
            paymentFee: feeBreakdown.paymentFeeAmt,
            total: feeBreakdown.totalFees,
            currency: 'USD',
          },
        });
        
        await tx.prompt.update({ where: { id: p.id }, data: { downloadCount: { increment: 1 } } });
        await tx.user.update({ where: { id: p.sellerId }, data: { totalEarnings: { increment: feeBreakdown.netAmount }, currentBalance: { increment: feeBreakdown.netAmount } } });
        await tx.notification.create({ data: { userId: p.sellerId, title: 'New Sale!', message: `Your prompt "${p.title}" was purchased via Google Play for $${amount.toFixed(2)} (net: $${feeBreakdown.netAmount.toFixed(2)} after fees)`, type: 'ORDER' } });
        
        createdOrders.push(order);
        totalAmount += amount;
      }
      
      // Deduct total from buyer's balance
      await tx.user.update({ where: { id: user.id! }, data: { totalSpent: { increment: totalAmount }, currentBalance: { decrement: totalAmount } } });
      
      return createdOrders;
    });

    // Payment risk scoring (non-blocking)
    const { ai } = await import('@/lib/ai-client');
    const seller = prompts.length > 0 ? await db.user.findUnique({ where: { id: prompts[0].sellerId }, select: { totalEarnings: true, isVerified: true } }) : null;
    const totalAmount = prompts.reduce((s, p) => s + (p.isFree ? 0 : p.price), 0);
    ai.payment.riskScore({
      userId: user.id!,
      email: user.email,
      amount: totalAmount,
      promptId: prompts[0]?.id || '',
      paymentMethod: 'PLAY_STORE',
      sellerId: prompts[0]?.sellerId || '',
      currency: 'USD',
      userCreatedAt: user.createdAt,
      userTotalSpent: user.totalSpent || 0,
      sellerTotalEarnings: seller?.totalEarnings || 0,
      sellerIsVerified: seller?.isVerified || false,
    }).catch(e => { console.error('[orders/verify-play] payment risk scoring error', e); });

    return NextResponse.json({ success: true, data: { orders: orders.map(o => o.id), count: orders.length } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

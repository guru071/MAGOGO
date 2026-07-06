import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const type = new URL(req.url).searchParams.get('type') || 'bought';
    const where = type === 'sold' ? { sellerId: user.id! } : { buyerId: user.id! };
    const orders = await db.order.findMany({ where, include: { prompt: { select: { id: true, title: true, sampleImages: true, price: true, isFree: true } }, buyer: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: orders });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Direct payment is no longer supported. Use Razorpay or Play Store checkout.' }, { status: 400 });
}
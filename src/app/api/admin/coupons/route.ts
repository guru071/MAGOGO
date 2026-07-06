import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: coupons });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const coupon = await db.coupon.create({ data: { code: body.code.toUpperCase(), discount: body.discount, maxUses: body.maxUses, minAmount: body.minAmount || 0, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } });
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
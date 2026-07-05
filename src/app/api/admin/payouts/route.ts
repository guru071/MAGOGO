import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const status = new URL(req.url).searchParams.get('status');
    const where: any = status ? { status } : {};
    const payouts = await db.payout.findMany({ where, include: { seller: { select: { name: true, email: true, paymentMethod: true, bankAccount: true, upiId: true, paypalEmail: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: payouts });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
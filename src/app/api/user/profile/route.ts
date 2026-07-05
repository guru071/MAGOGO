import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const allowed = ['name', 'bio', 'avatar', 'bankName', 'bankAccount', 'bankIfsc', 'upiId', 'paypalEmail', 'paymentMethod'];
    const updateData: any = {};
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updateData[k] = typeof body[k] === 'string' ? sanitizeInput(body[k]) : body[k];
      }
    }
    const updated = await db.user.update({ where: { id: user.id }, data: updateData });
    return NextResponse.json({ success: true, data: updated });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

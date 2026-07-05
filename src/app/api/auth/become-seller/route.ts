import { db } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { bankName, bankAccount, bankIfsc, upiId, paypalEmail, paymentMethod, bio } = await req.json();
    const sanitizedBio = sanitizeInput(bio || '');

    const profile = await db.user.findUnique({ where: { authUserId: user.id } });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.isActive || profile.isBanned) {
      return NextResponse.json({ success: false, error: 'Account is suspended' }, { status: 403 });
    }

    const normalizedPaymentMethod = typeof paymentMethod === 'string' ? paymentMethod : '';
    if (normalizedPaymentMethod === 'BANK_TRANSFER' && (!bankName || !bankAccount || !bankIfsc)) {
      return NextResponse.json({ success: false, error: 'Bank name, account number, and IFSC are required for bank transfer payouts' }, { status: 400 });
    }
    if (normalizedPaymentMethod === 'UPI' && !upiId) {
      return NextResponse.json({ success: false, error: 'UPI ID is required for UPI payouts' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: profile.id },
      data: {
        isSeller: true,
        role: profile.role === 'BUYER' ? 'SELLER' : profile.role,
        bankName, bankAccount, bankIfsc, upiId, paypalEmail, paymentMethod, bio: sanitizedBio,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

import { db } from '@/lib/db';
import { signupWithSupabase } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/ai-client';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, password, and name required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { user, profile } = await signupWithSupabase(email, password, name);

    // AI Fraud check with auto-blocking
    ai.fraud.checkUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.createdAt,
      role: profile.role,
      isVerified: profile.isVerified,
      isSeller: profile.isSeller,
    }).then(async (result) => {
      if (result.success && result.data) {
        const data = result.data as any;
        const riskScore = data.riskScore ?? data.risk_score ?? 0;

        // Get auto-block threshold from settings
        const settings = await db.platformSettings.findFirst({ where: { key: 'fraud_config' } });
        let autoBlockThreshold = 90;
        if (settings?.value) {
          try { autoBlockThreshold = JSON.parse(settings.value as string).autoBlockThreshold ?? 90; } catch (e) { console.error('[auth/register] parse fraud config error', e); }
        }

        // Create security case
        await db.securityCase.create({
          data: {
            userId: profile.id,
            type: 'FRAUD',
            entityType: 'USER',
            entityId: profile.id,
            riskScore,
            signals: JSON.stringify(data.signals || data),
            status: riskScore >= autoBlockThreshold ? 'OPEN' : 'OPEN',
          },
        });

        // Auto-block if score exceeds threshold
        if (riskScore >= autoBlockThreshold) {
          await db.user.update({ where: { id: profile.id }, data: { isBanned: true } });
        }
      }
    }).catch(e => { console.error('[auth/register] ai fraud check error', e); });

    // Send Welcome Email
    import('@/lib/email').then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail(profile.email, profile.name).catch(e => console.error('[email] register failed', e));
    });

    return NextResponse.json({
      success: true,
      data: { user: profile, supabaseUser: user },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

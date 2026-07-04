import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let settings = await db.securitySettings.findUnique({ where: { userId: user.id } });
    if (!settings) {
      settings = await db.securitySettings.create({ data: { userId: user.id! } });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const allowedFields = [
      'sessionTimeout', 'maxLoginAttempts', 'passwordMinLength',
      'requireUppercase', 'requireNumbers', 'requireSpecialChars',
      'lastPasswordChange', 'lastTwoFactorSetup', 'recoveryEmail', 'recoveryPhone',
    ];
    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const settings = await db.securitySettings.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id!, ...data },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

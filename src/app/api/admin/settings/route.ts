import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const settings = await db.platformSettings.findMany();
    const data: Record<string, string> = {};
    settings.forEach(s => data[s.key] = s.value);
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { key, value } = await req.json();
    const setting = await db.platformSettings.upsert({ where: { key }, update: { value }, create: { key, value } });
    return NextResponse.json({ success: true, data: setting });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
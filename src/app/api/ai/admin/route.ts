import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const health = await ai.health();
    return NextResponse.json({ success: true, data: health });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    if (body.action === 'train') {
      const result = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/v1/train`, { method: 'POST' });
      const data = await result.json();
      return NextResponse.json({ success: true, data: data.data });
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

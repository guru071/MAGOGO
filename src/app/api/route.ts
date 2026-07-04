import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userCount = await db.user.count();
    const promptCount = await db.prompt.count();
    return NextResponse.json({
      status: 'ok',
      service: 'maghgo-api',
      stats: { users: userCount, prompts: promptCount },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[api/root] error', e);
    return NextResponse.json({ status: 'degraded', service: 'maghgo-api' });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { ai } from '@/lib/ai-client';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const type = req.nextUrl.searchParams.get('type') || 'prompt';
    const id = req.nextUrl.searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    if (type === 'user') {
      const user = await db.user.findUnique({ where: { id } });
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      const result = await ai.features.user(user);
      return NextResponse.json(result);
    }

    const prompt = await db.prompt.findUnique({ where: { id } });
    if (!prompt) return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    const result = await ai.features.prompt(prompt);
    return NextResponse.json(result);
  } catch (e: any) {
    const status = e.message === 'Unauthorized' ? 401 : e.message?.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const items = await db.wishlist.findMany({ where: { userId: user.id! }, include: { prompt: true }, orderBy: { createdAt: 'desc' } });
    const prompts = items.map(item => item.prompt);
    const sanitizedPrompts = await sanitizePromptsForUser(prompts, user);
    const promptById = new Map(sanitizedPrompts.map(prompt => [prompt.id, prompt]));
    return NextResponse.json({
      success: true,
      data: items.map(item => ({ ...item, prompt: promptById.get(item.promptId) || item.prompt })),
    });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { promptId } = await req.json();
    const existing = await db.wishlist.findUnique({ where: { userId_promptId: { userId: user.id!, promptId } } });
    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { wishlisted: false } });
    } else {
      const prompt = await db.prompt.findUnique({ where: { id: promptId }, select: { id: true, status: true } });
      if (!prompt || prompt.status !== 'APPROVED') {
        return NextResponse.json({ success: false, error: 'Prompt not available' }, { status: 404 });
      }
      await db.wishlist.create({ data: { userId: user.id!, promptId } });
      return NextResponse.json({ success: true, data: { wishlisted: true } });
    }
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('promptId');

    if (promptId && promptId !== 'all') {
      const qnas = await db.qnA.findMany({
        where: { promptId },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          answer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: qnas });
    }

    const qnas = await db.qnA.findMany({
      include: {
        prompt: { select: { id: true, title: true, slug: true } },
        author: { select: { id: true, name: true, avatar: true } },
        answer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: qnas });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { promptId, question } = await req.json();
    if (!promptId || !question) {
      return NextResponse.json({ success: false, error: 'promptId and question are required' }, { status: 400 });
    }

    const prompt = await db.prompt.findUnique({ where: { id: promptId } });
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    const qna = await db.qnA.create({
      data: {
        promptId,
        authorId: user.id!,
        question,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, data: qna }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('promptId');

    const where: any = {};
    if (promptId) where.promptId = promptId;

    const qnas = await db.qnA.findMany({
      where,
      include: {
        author: { select: { name: true, avatar: true } },
        answer: { select: { name: true, avatar: true, isSeller: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: qnas });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const promptId = body.promptId;
    const question = body.question || body.title;

    if (!promptId || !question) {
      return NextResponse.json({ success: false, error: 'Prompt ID and question are required' }, { status: 400 });
    }

    const qna = await db.qnA.create({
      data: { promptId, authorId: user.id, question }
    });

    return NextResponse.json({ success: true, data: qna });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user.isSeller) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const qnaId = body.qnaId || body.questionId;
    const answerText = body.answerText || body.answer;

    if (!qnaId || !answerText) {
      return NextResponse.json({ success: false, error: 'QnA ID and answer text are required' }, { status: 400 });
    }

    const qna = await db.qnA.findUnique({
      where: { id: qnaId },
      include: { prompt: true }
    });

    if (!qna) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    if (qna.prompt.sellerId !== user.id) return NextResponse.json({ success: false, error: 'You do not own this prompt' }, { status: 403 });

    const updated = await db.qnA.update({
      where: { id: qnaId },
      data: { answerId: user.id, answerText }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
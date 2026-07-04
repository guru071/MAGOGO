import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const flashDeals = await db.flashDeal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        prompt: { select: { id: true, title: true, price: true } },
      },
    });

    return NextResponse.json({ success: true, data: flashDeals });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { promptId, discount, startsAt, endsAt, maxClaims } = await req.json();
    
    // Check if prompt exists
    const prompt = await db.prompt.findUnique({ where: { id: promptId } });
    if (!prompt) return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });

    // Ensure no overlapping active flash deals for the same prompt
    const existing = await db.flashDeal.findFirst({
      where: {
        promptId,
        isActive: true,
        endsAt: { gt: new Date() }
      }
    });
    
    if (existing) {
      return NextResponse.json({ success: false, error: 'An active flash deal already exists for this prompt' }, { status: 400 });
    }

    const flashDeal = await db.flashDeal.create({
      data: {
        promptId,
        discount: parseInt(discount),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        maxClaims: parseInt(maxClaims) || 100,
      },
      include: {
        prompt: { select: { id: true, title: true, price: true } }
      }
    });

    await db.activityLog.create({
      data: {
        userId: user.id!,
        action: 'ADMIN_CREATED_FLASH_DEAL',
        details: JSON.stringify({ flashDealId: flashDeal.id, promptId }),
      },
    });

    return NextResponse.json({ success: true, data: flashDeal }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await db.flashDeal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

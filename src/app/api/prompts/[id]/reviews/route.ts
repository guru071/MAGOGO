import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await db.review.findMany({ where: { promptId: id }, include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: reviews });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { rating, comment } = await req.json();
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ success: false, error: 'Rating 1-5 required' }, { status: 400 });
    const sanitizedComment = sanitizeInput(comment || '');
    
    const existing = await db.review.findFirst({ where: { userId: user.id!, promptId: id } });
    if (existing) return NextResponse.json({ success: false, error: 'Already reviewed' }, { status: 400 });

    const order = await db.order.findFirst({ where: { buyerId: user.id!, promptId: id, status: 'COMPLETED' } });
    if (!order) return NextResponse.json({ success: false, error: 'You must purchase this prompt before leaving a review.' }, { status: 403 });

    const review = await db.review.create({ data: { userId: user.id!, promptId: id, rating, comment: sanitizedComment }, include: { user: { select: { id: true, name: true, avatar: true } } } });
    const allReviews = await db.review.findMany({ where: { promptId: id } });
    const avg = allReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / allReviews.length;
    await db.prompt.update({ where: { id }, data: { rating: Math.round(avg * 100) / 100, reviewCount: allReviews.length } });
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
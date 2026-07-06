import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isSeller && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing prompt ID' }, { status: 400 });
    }

    const prompt = await db.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this prompt' }, { status: 403 });
    }

    // Soft delete to maintain financial/order history without refunding the admin or seller
    await db.prompt.update({
      where: { id },
      data: { status: 'DELETED' }
    });

    return NextResponse.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error: unknown) {
    console.error('[API] DELETE /api/seller/prompts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete prompt' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isSeller && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing prompt ID' }, { status: 400 });
    }

    const body = await req.json();
    const { price } = body;

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ success: false, error: 'Invalid price' }, { status: 400 });
    }

    const prompt = await db.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized to edit this prompt' }, { status: 403 });
    }

    await db.prompt.update({
      where: { id },
      data: { price: Number(price), isFree: Number(price) === 0 }
    });

    return NextResponse.json({ success: true, message: 'Price updated successfully', data: { price: Number(price), isFree: Number(price) === 0 } });
  } catch (error: unknown) {
    console.error('[API] PATCH /api/seller/prompts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update prompt' }, { status: 500 });
  }
}

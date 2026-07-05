import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { prompt: true }
        }
      }
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.id },
        include: { items: { include: { prompt: true } } }
      });
    }

    const prompts = cart.items.map(item => item.prompt);
    const sanitizedPrompts = await sanitizePromptsForUser(prompts, user);
    const promptById = new Map(sanitizedPrompts.map(prompt => [prompt.id, prompt]));
    const safeCart = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        prompt: promptById.get(item.promptId) || item.prompt,
      })),
    };

    return NextResponse.json({ success: true, data: safeCart });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { promptId } = await req.json();
    if (!promptId) return NextResponse.json({ success: false, error: 'Prompt ID is required' }, { status: 400 });

    const prompt = await db.prompt.findUnique({ where: { id: promptId } });
    if (!prompt || prompt.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Prompt not available' }, { status: 404 });
    }

    let cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await db.cart.create({ data: { userId: user.id } });
    }

    // Check if item already exists
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_promptId: {
          cartId: cart.id,
          promptId
        }
      }
    });

    if (existingItem) {
      return NextResponse.json({ success: false, error: 'Item already in cart' }, { status: 400 });
    }

    const item = await db.cartItem.create({
      data: {
        cartId: cart.id,
        promptId
      },
      include: { prompt: true }
    });

    const [safePrompt] = await sanitizePromptsForUser([item.prompt], user);
    return NextResponse.json({ success: true, data: { ...item, prompt: safePrompt } });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });

    await db.cartItem.delete({
      where: {
        id: itemId,
        cartId: cart.id // ensure security
      }
    });

    return NextResponse.json({ success: true });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

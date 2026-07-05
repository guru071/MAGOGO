import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { canViewPromptMetadata, sanitizePromptForUser } from '@/lib/prompt-security';
import { deleteImage } from '@/lib/cloudinary';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sanitizeInput } from '@/lib/security';

async function deletePromptImages(sampleImages: string) {
  try {
    const images: string[] = JSON.parse(sampleImages || '[]');
    for (const url of images) {
      if (url.includes('res.cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length > 1) {
          let path = parts[1];
          if (path.match(/^v\d+\//)) path = path.replace(/^v\d+\//, '');
          const publicId = path.substring(0, path.lastIndexOf('.')) || path;
          await deleteImage(publicId).catch(console.error);
        }
      } else if (url.includes('supabase.co')) {
        const parts = url.split('/public/prompts/');
        if (parts.length > 1) {
          const supabase = createSupabaseAdminClient();
          await supabase.storage.from('prompts').remove([parts[1]]).catch(console.error);
        }
      }
    }
  } catch (e) {
    console.error('Error deleting images', e);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const prompt = await db.prompt.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isSeller: true, totalEarnings: true, bio: true, isVerified: true } },
        category: true,
        reviews: { include: { user: { select: { id: true, name: true, avatar: true, isVerified: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!prompt) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (!canViewPromptMetadata(prompt, user)) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    await db.prompt.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    const sanitizedPrompt = await sanitizePromptForUser(prompt, user);
    const hasPurchased = sanitizedPrompt.accessReason === 'PURCHASED';

    return NextResponse.json({ success: true, data: { ...sanitizedPrompt, hasPurchased } });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await db.prompt.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (existing.sellerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const updateData: any = {};
    const allowed = ['title', 'description', 'promptText', 'sampleImages', 'categoryId', 'tags', 'recommendedAI', 'price', 'isFree', 'discount', 'originalPrice', 'status', 'isFeatured', 'isTrending', 'isPremium'];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        const val = typeof body[k] === 'object' && k !== 'price' && k !== 'discount' ? JSON.stringify(body[k]) : body[k];
        updateData[k] = typeof val === 'string' ? sanitizeInput(val) : val;
      }
    }
    const prompt = await db.prompt.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: prompt });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await db.prompt.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (existing.sellerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    await deletePromptImages(existing.sampleImages);
    await db.prompt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

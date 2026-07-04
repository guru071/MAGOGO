import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@/lib/cloudinary';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const prompt = await db.prompt.update({ where: { id }, data: { status: body.status, isFeatured: body.isFeatured, isTrending: body.isTrending } });
    if (body.status === 'APPROVED') await db.notification.create({ data: { userId: prompt.sellerId, title: 'Prompt Approved!', message: `Your prompt "${prompt.title}" has been approved.`, type: 'SYSTEM' } });
    return NextResponse.json({ success: true, data: prompt });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const existing = await db.prompt.findUnique({ where: { id } });
    if (existing) {
      await deletePromptImages(existing.sampleImages);
    }
    await db.prompt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
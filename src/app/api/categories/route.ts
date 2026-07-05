import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const where: any = { isActive: true };
    if (parentId) where.parentId = parentId; else where.parentId = null;
    let cats = await db.category.findMany({ where, include: { _count: { select: { prompts: { where: { status: 'APPROVED' } } } } }, orderBy: { sortOrder: 'asc' } });
    
    // Auto-seed if empty
    if (cats.length === 0 && !parentId) {
      const defaultCats = [
        { name: 'ChatGPT', slug: 'chatgpt', description: 'Prompts for ChatGPT' },
        { name: 'Midjourney', slug: 'midjourney', description: 'Prompts for Midjourney' },
        { name: 'DALL-E', slug: 'dalle', description: 'Prompts for DALL-E' },
        { name: 'Stable Diffusion', slug: 'stable-diffusion', description: 'Prompts for Stable Diffusion' },
        { name: 'Coding & Dev', slug: 'coding', description: 'Coding & development prompts' },
        { name: 'Marketing', slug: 'marketing', description: 'Marketing prompts' },
        { name: 'Writing', slug: 'writing', description: 'Writing prompts' },
        { name: 'Business', slug: 'business', description: 'Business prompts' },
        { name: 'Photography', slug: 'photography', description: 'Photography prompts' },
        { name: 'Video Generation', slug: 'video', description: 'Video generation prompts' },
        { name: 'Music & Audio', slug: 'music', description: 'Music & audio prompts' },
        { name: 'Education', slug: 'education', description: 'Educational prompts' },
        { name: 'Claude AI', slug: 'claude', description: 'Prompts for Claude AI' },
        { name: 'Gemini', slug: 'gemini', description: 'Prompts for Gemini' },
        { name: 'Open Source Models', slug: 'open-source', description: 'Prompts for open source models' },
        { name: 'Video Creation', slug: 'video-creation', description: 'Video creation prompts' },
      ];
      await db.category.createMany({ data: defaultCats });
      cats = await db.category.findMany({ where, include: { _count: { select: { prompts: { where: { status: 'APPROVED' } } } } }, orderBy: { sortOrder: 'asc' } });
    }

    const data = cats.map(c => ({ ...c, promptCount: c._count?.prompts || 0, _count: undefined }));
    return NextResponse.json({ success: true, data });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
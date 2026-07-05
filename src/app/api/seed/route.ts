import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CATEGORIES = [
  { name: 'ChatGPT Prompts', slug: 'chatgpt', icon: '💬', description: 'Prompts for OpenAI ChatGPT, GPT-4, GPT-4o' },
  { name: 'Midjourney', slug: 'midjourney', icon: '🎨', description: 'Prompts for Midjourney v6 image generation' },
  { name: 'DALL-E', slug: 'dalle', icon: '🖼️', description: 'Prompts for DALL-E 3 image creation' },
  { name: 'Stable Diffusion', slug: 'stable-diffusion', icon: '✨', description: 'Prompts for Stable Diffusion XL & SD3' },
  { name: 'Coding & Dev', slug: 'coding', icon: '💻', description: 'Programming, GitHub Copilot, Cursor, v0.dev' },
  { name: 'Marketing', slug: 'marketing', icon: '📢', description: 'Marketing, Jasper AI, Copy.ai prompts' },
  { name: 'Writing', slug: 'writing', icon: '✍️', description: 'Creative writing, Claude, Gemini prompts' },
  { name: 'Business', slug: 'business', icon: '💼', description: 'Business strategy, planning, analysis' },
  { name: 'Photography', slug: 'photography', icon: '📷', description: 'Photography and image editing prompts' },
  { name: 'Video Generation', slug: 'video', icon: '🎬', description: 'Sora, Runway, Pika, Kling prompts' },
  { name: 'Music & Audio', slug: 'music', icon: '🎵', description: 'Suno AI, Udio, ElevenLabs prompts' },
  { name: 'Education', slug: 'education', icon: '🎓', description: 'Learning, teaching, Perplexity prompts' },
  { name: 'Claude AI', slug: 'claude', icon: '🧠', description: 'Prompts for Claude 3.5 Sonnet, Opus, Haiku' },
  { name: 'Gemini', slug: 'gemini', icon: '✨', description: 'Prompts for Google Gemini Pro & Ultra' },
  { name: 'Open Source Models', slug: 'open-source', icon: '📦', description: 'Llama, Mistral, Qwen, DeepSeek prompts' },
  { name: 'Video Creation', slug: 'video-creation', icon: '🎥', description: 'Synthesia, video editing, animation' },
];

export async function POST() {
  try {
    // Delete existing data (keep registered users, remove default admin only)
    await db.review.deleteMany();
    await db.comment.deleteMany();
    await db.like.deleteMany();
    await db.wishlist.deleteMany();
    await db.notification.deleteMany();
    await db.activityLog.deleteMany();
    await db.report.deleteMany();
    await db.coupon.deleteMany();
    await db.flashDeal.deleteMany();
    await db.chatMessage.deleteMany();
    await db.loginHistory.deleteMany();
    await db.platformSettings.deleteMany();
    await db.prompt.deleteMany();
    await db.category.deleteMany();
    await db.user.deleteMany({ where: { email: 'admin@maghgo.com' } });

    // 1. Platform settings
    await db.platformSettings.createMany({
      data: [
        { key: 'commissionRate', value: '10' },
        { key: 'platformName', value: 'MAGHGO' },
        { key: 'minWithdrawal', value: '50' },
        { key: 'payoutCycleDays', value: '10' },
        { key: 'supportEmail', value: 'support@maghgo.com' },
        { key: 'supportedCurrencies', value: JSON.stringify(['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'SAR', 'JPY']) },
      ],
    });

    // 2. Categories — admin can edit/delete these from the admin panel
    const cats: any[] = [];
    for (let i = 0; i < CATEGORIES.length; i++) {
      const c = CATEGORIES[i];
      const cat = await db.category.create({
        data: {
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          description: c.description,
          sortOrder: i,
          promptCount: 0,
          isActive: true,
        },
      });
      cats.push(cat);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Platform settings and categories seeded. No default admin — register a new account to get started.',
        stats: {
          categories: cats.length,
          settings: 6,
        },
      },
    });
  } catch { 
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
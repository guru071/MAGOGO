import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const categories = [
  { name: 'ChatGPT', slug: 'chatgpt', description: 'Prompts for OpenAI ChatGPT' },
  { name: 'Midjourney', slug: 'midjourney', description: 'Prompts for Midjourney Image Generation' },
  { name: 'DALL-E', slug: 'dalle', description: 'Prompts for OpenAI DALL-E' },
  { name: 'Stable Diffusion', slug: 'stable-diffusion', description: 'Prompts for Stable Diffusion' },
  { name: 'Coding', slug: 'coding', description: 'Software engineering & coding prompts' },
  { name: 'Marketing', slug: 'marketing', description: 'Marketing & copywriting prompts' },
  { name: 'Writing', slug: 'writing', description: 'Creative writing & blogging prompts' },
  { name: 'Business', slug: 'business', description: 'Business strategy & productivity prompts' },
  { name: 'Photography', slug: 'photography', description: 'Photography & camera settings prompts' },
  { name: 'Video', slug: 'video', description: 'Video editing & production prompts' },
  { name: 'Music', slug: 'music', description: 'Music production & audio prompts' },
  { name: 'Education', slug: 'education', description: 'Learning & teaching prompts' },
  { name: 'Claude', slug: 'claude', description: 'Prompts for Anthropic Claude' },
  { name: 'Gemini', slug: 'gemini', description: 'Prompts for Google Gemini' },
  { name: 'Open Source', slug: 'open-source', description: 'Prompts for open source AI models' },
  { name: 'Video Creation', slug: 'video-creation', description: 'AI Video creation prompts (Sora, Runway)' },
];

async function seed() {
  console.log('🌱 Seeding categories...');
  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`✅ Inserted: ${cat.name}`);
  }
  console.log('🎉 Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());

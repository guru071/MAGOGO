import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a seller user
  const seller = await prisma.user.create({
    data: {
      authUserId: 'user_123',
      email: 'guru@maghgo.com',
      name: 'Guru Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guru',
      isSeller: true,
    },
  });

  // Create a category
  const category = await prisma.category.create({
    data: {
      name: 'Midjourney',
      slug: 'midjourney',
      description: 'Prompts for Midjourney v5 and v6',
      icon: '/icons/midjourney.svg',
    },
  });

  // Create prompts
  const prompts = [
    {
      title: 'Hyper-Realistic Cyberpunk Cityscape',
      slug: 'hyper-realistic-cyberpunk-cityscape',
      description: 'A highly detailed prompt for generating cyberpunk cities with neon lights and rain.',
      price: 4.99,
      promptText: 'A sprawling cyberpunk city at night, heavy rain, neon signs reflecting on wet pavement, volumetric fog, cinematic lighting, 8k resolution, photorealistic, octane render --ar 16:9 --v 6.0',
      status: 'APPROVED',
      isTrending: true,
      categoryId: category.id,
      sellerId: seller.id,
      sampleImages: JSON.stringify(['https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop']),
      tags: JSON.stringify(['cyberpunk', 'city', 'neon']),
      recommendedAI: 'Midjourney v6'
    },
    {
      title: 'Minimalist Logo Design Pack',
      slug: 'minimalist-logo-design-pack',
      description: 'Generate clean, modern, and minimalist logos for tech startups.',
      price: 2.99,
      promptText: 'Minimalist vector logo for a tech startup, geometric shapes, flat colors, negative space, clean white background, dribbble style --no shading, 3d, realistic --v 5.2',
      status: 'APPROVED',
      isTrending: true,
      categoryId: category.id,
      sellerId: seller.id,
      sampleImages: JSON.stringify(['https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000&auto=format&fit=crop']),
      tags: JSON.stringify(['logo', 'minimalist', 'branding']),
      recommendedAI: 'Midjourney v5.2'
    },
    {
      title: 'Ethereal Fantasy Character Portrait',
      slug: 'ethereal-fantasy-character-portrait',
      description: 'Beautiful, glowing fantasy character portraits perfect for RPGs.',
      price: 6.99,
      promptText: 'A stunning portrait of an elven mage, glowing ethereal magic, intricate silver armor, bioluminescent forest background, soft ethereal lighting, digital painting, artstation, concept art --ar 4:5 --niji 6',
      status: 'APPROVED',
      isTrending: false,
      isPremium: true,
      categoryId: category.id,
      sellerId: seller.id,
      sampleImages: JSON.stringify(['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop']),
      tags: JSON.stringify(['fantasy', 'character', 'rpg']),
      recommendedAI: 'Midjourney Niji 6'
    }
  ];

  for (const p of prompts) {
    await prisma.prompt.create({ data: p });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: require('ws') } // Fix websocket error in node 20
});

async function main() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'SELLER' } });
    if (!user) throw new Error('Seller not found');
    console.log('Using Seller:', user.email);

    const buffer = fs.readFileSync('./public/logo.jpeg');
    const finalBuffer = await sharp(buffer).jpeg({ quality: 75 }).toBuffer();
    
    const filename = `${user.id}/test-prompt-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('prompts').upload(filename, finalBuffer, { contentType: 'image/jpeg' });
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('prompts').getPublicUrl(filename);
    console.log('Image uploaded to Supabase:', publicUrl);

    let category = await prisma.category.findFirst();
    if (!category) {
       category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category', description: 'Test' } });
    }

    const prompt = await prisma.prompt.create({
      data: {
        title: 'Backend Upload Test',
        slug: `test-prompt-${Date.now()}`,
        description: 'Testing the Supabase integration and compression.',
        promptText: 'You are an advanced test AI.',
        sampleImages: JSON.stringify([publicUrl]),
        tags: 'test, ai',
        recommendedAI: 'ChatGPT',
        price: 9.99,
        sellerId: user.id,
        categoryId: category.id,
        status: 'PUBLISHED'
      }
    });

    console.log('TEST COMPLETED SUCCESSFULLY! Prompt created:', prompt.title);
    
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();

import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const prompts = await prisma.prompt.findMany({ take: 5, include: { seller: true } });
    console.log(`Found ${prompts.length} prompts.`);
    if (prompts.length > 0) {
      console.log(prompts[0].title);
    }
  } catch (error) {
    console.error("Error connecting to DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

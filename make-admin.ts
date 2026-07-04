import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.user.update({
  where: { email: 'guruprasath23062008@gmail.com' },
  data: { role: 'ADMIN' }
}).then(() => {
  console.log('✅ You are now an ADMIN! Refresh the page!');
}).catch(console.error).finally(() => db.$disconnect());

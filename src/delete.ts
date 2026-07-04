const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('DELETE FROM auth.users').then(() => {
  console.log('Successfully cleared auth.users!');
  process.exit(0);
}).catch(console.error);

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const from = new Date();
  from.setDate(from.getDate() - 90);
  const to = new Date();

  console.log("1");
  await db.$queryRawUnsafe(`SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, SUM(amount) AS total FROM "Order" WHERE status='COMPLETED' AND "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to);
  console.log("2");
  await db.$queryRawUnsafe(`SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to);
  console.log("3");
  await db.$queryRawUnsafe(`SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "User" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to);
  console.log("4");
  await db.$queryRawUnsafe(`SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "Prompt" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to);
  console.log("5");
  await db.$queryRawUnsafe(`SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "User" WHERE "isSeller"=true AND "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to);
  
  console.log("6");
  await db.$queryRawUnsafe(`SELECT c.name, COALESCE(SUM(o.amount), 0) AS revenue, COUNT(o.id) AS orders, COALESCE(AVG(NULLIF(p.price, 0)), 0) AS "avgPrice", COUNT(DISTINCT p."sellerId") AS sellers, COUNT(DISTINCT p.id) AS prompts, COALESCE(SUM(CASE WHEN o.status='REFUNDED' THEN o.amount ELSE 0 END), 0) AS refunds FROM "Category" c LEFT JOIN "Prompt" p ON p."categoryId" = c.id LEFT JOIN "Order" o ON o."promptId" = p.id AND o."createdAt">=$1 AND o."createdAt"<=$2 GROUP BY c.id ORDER BY revenue DESC LIMIT 20`, from, to);

  console.log("7");
  await db.$queryRawUnsafe(`SELECT "paymentMethod", COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS count, COALESCE(AVG(amount), 0) AS "avgAmount" FROM "Order" WHERE status='COMPLETED' AND "createdAt">=$1 AND "createdAt"<=$2 GROUP BY "paymentMethod" ORDER BY revenue DESC`, from, to);

  console.log("8");
  await db.$queryRawUnsafe(`SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY hour ORDER BY hour`, from, to);
  console.log("9");
  await db.$queryRawUnsafe(`SELECT EXTRACT(DOW FROM "createdAt")::int AS dow, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY dow ORDER BY dow`, from, to);
  console.log("10");
  await db.$queryRawUnsafe(`SELECT EXTRACT(MONTH FROM "createdAt")::int AS month, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY month ORDER BY month`, from, to);

  console.log("11");
  await db.$queryRawUnsafe(`SELECT u.id, u.name, u.email, COALESCE(SUM(o.amount), 0) AS revenue, COUNT(o.id) AS sales, (SELECT COUNT(*) FROM "Prompt" p WHERE p."sellerId"=u.id AND p.status='APPROVED') AS "promptCount", COALESCE(AVG(p.rating), 0) AS "avgRating", COALESCE(SUM(CASE WHEN o.status='REFUNDED' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(o.id), 0), 0) AS "refundRate" FROM "User" u JOIN "Order" o ON o."sellerId"=u.id AND o.status='COMPLETED' AND o."createdAt">=$1 AND o."createdAt"<=$2 GROUP BY u.id ORDER BY revenue DESC LIMIT 20`, from, to);

  console.log("All done.");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

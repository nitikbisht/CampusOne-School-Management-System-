const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS sessions CASCADE`);
  console.log('Sessions table dropped');
  await prisma.$disconnect();
}

main().catch(console.error);
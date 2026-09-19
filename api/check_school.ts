import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findUnique({ where: { code: "DEMO" } });
  console.log("School:", school);
}

main().finally(() => prisma.$disconnect());

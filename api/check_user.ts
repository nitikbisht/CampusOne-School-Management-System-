import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { 
      schoolId_email: { 
        schoolId: "2863124a-76bb-4c5a-bb32-155efac4ff61", 
        email: "admin@campusone.test" 
      }
    },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
    }
  });
  console.log("User:", user ? JSON.stringify(user, null, 2) : "NOT FOUND");
}

main().finally(() => prisma.$disconnect());

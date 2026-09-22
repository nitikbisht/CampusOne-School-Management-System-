import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: "demo", email: "admin@campusone.test" } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    console.log("User found:", !!user);
    if (user) {
      console.log("User:", {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        passwordHash: user.passwordHash.substring(0, 20) + "...",
        roles: user.roles.map(r => r.role.name),
      });

      // Test password
      const valid = await bcrypt.compare("ChangeMe-12345", user.passwordHash);
      console.log("Password valid:", valid);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
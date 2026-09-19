/**
 * Idempotent seed: safe to run many times. Creates FAKE demo data for development.
 * Usage: npm run db:seed   (refuses to run when NODE_ENV=production)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATALOG } from "../src/lib/permissions.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed demo data in production");
}

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { code: "DEMO" },
    update: {},
    create: { name: "Demo School", code: "DEMO" },
  });
  const schoolId = school.id;

  // Permissions (global catalog)
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, action: p.action },
      create: p,
    });
  }
  const permissions = await prisma.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

  // Roles + their default permissions
  const roleIdByName = new Map<string, string>();
  for (const [name, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { schoolId_name: { schoolId, name } },
      update: {},
      create: { schoolId, name, isSystem: true },
    });
    roleIdByName.set(name, role.id);

    // Sync permissions: remove old ones not in DEFAULT_ROLE_PERMISSIONS, add new ones
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingPermissionIds = new Set(existingPermissions.map((rp) => rp.permissionId));
    const desiredPermissionIds = keys.map((key) => permissionIdByKey.get(key) as string).filter(Boolean);

    // Remove permissions that are no longer in the default set
    const toRemove = existingPermissions.filter(
      (rp) => !desiredPermissionIds.includes(rp.permissionId),
    );
    if (toRemove.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toRemove.map((rp) => rp.permissionId) } },
      });
    }

    // Add new permissions
    await prisma.rolePermission.createMany({
      data: desiredPermissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  // Demo admin user
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@campusone.test";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-12345";
  const admin = await prisma.user.upsert({
    where: { schoolId_email: { schoolId, email } },
    update: {},
    create: {
      schoolId,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: "Demo",
      lastName: "Admin",
    },
  });
  await prisma.userRole.createMany({
    data: [{ userId: admin.id, roleId: roleIdByName.get("Admin") as string }],
    skipDuplicates: true,
  });

  // Academic year
  const year = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId, name: "2026-27" } },
    update: {},
    create: {
      schoolId,
      name: "2026-27",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
      status: "ACTIVE",
      isCurrent: true,
    },
  });

  // Classes 1-12, sections A and B
  for (let n = 1; n <= 12; n++) {
    const schoolClass = await prisma.schoolClass.upsert({
      where: { schoolId_name: { schoolId, name: `Class ${n}` } },
      update: {},
      create: { schoolId, name: `Class ${n}`, displayOrder: n },
    });
    for (const name of ["A", "B"]) {
      await prisma.section.upsert({
        where: {
          academicYearId_classId_name: { academicYearId: year.id, classId: schoolClass.id, name },
        },
        update: {},
        create: {
          schoolId,
          academicYearId: year.id,
          classId: schoolClass.id,
          name,
          capacity: 40,
        },
      });
    }
  }

  // Subject types + subjects
  const typeIdByName = new Map<string, string>();
  for (const name of ["Core", "Elective", "Practical", "Co-curricular"]) {
    const type = await prisma.subjectType.upsert({
      where: { schoolId_name: { schoolId, name } },
      update: {},
      create: { schoolId, name },
    });
    typeIdByName.set(name, type.id);
  }
  const subjects = [
    { name: "Mathematics", code: "MATH", type: "Core" },
    { name: "English", code: "ENG", type: "Core" },
    { name: "Science", code: "SCI", type: "Core" },
    { name: "Social Studies", code: "SST", type: "Core" },
    { name: "Computer Science", code: "CS", type: "Elective" },
  ];
  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { schoolId_code: { schoolId, code: s.code } },
      update: {},
      create: {
        schoolId,
        name: s.name,
        code: s.code,
        subjectTypeId: typeIdByName.get(s.type) as string,
      },
    });
  }

  console.log(`Seed complete. Demo login (once auth exists): ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient, Prisma, School, User, Role } from "@prisma/client";

const prisma = new PrismaClient();

type SchoolWithRelations = School & {
  academicYears: Prisma.AcademicYearGetPayload<{}>[];
  users: Prisma.UserGetPayload<{ include: { roles: { include: { role: true } } } }>[];
};

export const schoolOnboardingRepository = {
  /** Check if school name, code, or email already exists */
  async checkUniqueness(params: { name?: string; code?: string; email?: string }): Promise<{
    nameExists: boolean;
    codeExists: boolean;
    emailExists: boolean;
  }> {
    const [nameExists, codeExists, emailExists] = await Promise.all([
      params.name ? prisma.school.findFirst({ where: { name: params.name } }) : Promise.resolve(null),
      params.code ? prisma.school.findUnique({ where: { code: params.code } }) : Promise.resolve(null),
      params.email ? prisma.user.findFirst({ where: { email: params.email } }) : Promise.resolve(null),
    ]);
    return {
      nameExists: !!nameExists,
      codeExists: !!codeExists,
      emailExists: !!emailExists,
    };
  },

  /** Create school with initial academic year and defaults */
  async createSchool(data: {
    name: string;
    code: string;
    address?: string;
    contactEmail: string;
    contactPhone?: string;
    timezone: string;
  }): Promise<School> {
    return prisma.school.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        timezone: data.timezone,
        isActive: true,
        academicYears: {
          create: {
            name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            startDate: new Date(new Date().getFullYear(), 3, 1), // April 1
            endDate: new Date(new Date().getFullYear() + 1, 2, 31), // March 31
            isCurrent: true,
          },
        },
        featureFlags: {
          create: [
            { key: "fee_module", name: "Fee Management", description: "Enable fee collection and tracking", enabled: true, scope: "GLOBAL" },
            { key: "attendance_module", name: "Attendance", description: "Enable attendance tracking", enabled: true, scope: "GLOBAL" },
            { key: "exam_module", name: "Examinations", description: "Enable exam management", enabled: true, scope: "GLOBAL" },
            { key: "parent_portal", name: "Parent Portal", description: "Enable parent access portal", enabled: false, scope: "GLOBAL" },
            { key: "teacher_portal", name: "Teacher Portal", description: "Enable teacher access portal", enabled: true, scope: "GLOBAL" },
          ],
        },
      },
    });
  },

  /** Create initial user for the school with role assignment */
  async createInitialUser(data: {
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    roleName: "Principal" | "Admin";
    passwordHash: string;
  }): Promise<User> {
    const role = await prisma.role.findUnique({
      where: { schoolId_name: { schoolId: data.schoolId, name: data.roleName } },
    });

    if (!role) {
      throw new Error(`Role ${data.roleName} not found for school`);
    }

    const user = await prisma.user.create({
      data: {
        schoolId: data.schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        isActive: true,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
    });

    return user;
  },

  /** Get school by ID with relations */
  async findSchoolById(id: string): Promise<SchoolWithRelations | null> {
    return prisma.school.findUnique({
      where: { id },
      include: {
        academicYears: { where: { isCurrent: true }, take: 1 },
        users: {
          where: { isActive: true },
          include: { roles: { include: { role: true } } },
          take: 5,
        },
        _count: {
          select: { users: true, students: true, classes: true },
        },
      },
    });
  },

  /** Get all schools with stats for developer switcher */
  async findAllSchools(): Promise<(School & { _count: { users: number; students: number; classes: number } })[]> {
    return prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true, students: true, classes: true },
        },
      },
    });
  },

  /** Update school */
  async updateSchool(id: string, data: Partial<Pick<School, "name" | "address" | "contactEmail" | "contactPhone" | "timezone" | "isActive">>): Promise<School> {
    return prisma.school.update({
      where: { id },
      data,
    });
  },

  /** Deactivate school (soft) */
  async deactivateSchool(id: string): Promise<School> {
    return prisma.school.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /** Get default roles for a school */
  async getDefaultRoles(schoolId: string): Promise<Role[]> {
    return prisma.role.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  },
};

export type SchoolOnboardingRepository = typeof schoolOnboardingRepository;
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const developerRepository = {
  /** Get all schools with optional filtering */
  async findSchools(query: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              academicYears: true,
            },
          },
        },
      }),
      prisma.school.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** Get school by ID */
  async findSchoolById(id: string) {
    return prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            academicYears: true,
          },
        },
      },
    });
  },

  /** Get dashboard aggregates */
  async getDashboardAggregates(schoolId?: string) {
    const schoolWhere = schoolId ? { id: schoolId } : {};

    // Schools stats
    const [schoolsTotal, schoolsActive, schoolsByYear] = await Promise.all([
      prisma.school.count({ where: schoolWhere }),
      prisma.school.count({ where: { ...schoolWhere, isActive: true } }),
      prisma.school.groupBy({
        by: ["createdAt"],
        where: schoolWhere,
        _count: { id: true },
      }),
    ]);

    // Process schools by year
    const yearCounts: Record<string, number> = {};
    schoolsByYear.forEach(s => {
      const year = new Date(s.createdAt).getFullYear().toString();
      yearCounts[year] = (yearCounts[year] || 0) + s._count.id;
    });
    const byYear = Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Students stats
    const studentWhere = schoolId ? { schoolId } : {};
    const [studentsTotal, studentsActive, studentsBySchool] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.student.count({ where: { ...studentWhere, status: "ACTIVE" } }),
      prisma.student.groupBy({
        by: ["schoolId"],
        where: studentWhere,
        _count: { id: true },
        take: 20,
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Get school names for students by school
    const schoolIds = studentsBySchool.map(s => s.schoolId);
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true },
    });
    const schoolNameMap = new Map(schools.map(s => [s.id, s.name]));
    const studentsBySchoolFormatted = studentsBySchool.map(s => ({
      schoolId: s.schoolId,
      schoolName: schoolNameMap.get(s.schoolId) || "Unknown",
      count: s._count.id,
    }));

    // Fees stats
    const feeWhere = schoolId ? { schoolId } : {};
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const [
      paymentsThisYear,
      studentFeesPending,
      paymentsByMonth,
      paymentsByFeeType,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ...feeWhere,
          status: "COMPLETED",
          paymentDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: { amount: true },
      }),
      prisma.studentFee.aggregate({
        where: {
          ...feeWhere,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
        _sum: { balanceAmount: true },
      }),
      prisma.$queryRaw<{ month: string; collected: number; outstanding: number }[]>`
        SELECT
          to_char("paymentDate", 'YYYY-MM') as month,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as collected,
          0 as outstanding
        FROM "payments"
        WHERE "schoolId" = ${schoolId || Prisma.sql`"schoolId"`}
          AND "paymentDate" >= ${startOfYear}
          AND "paymentDate" <= ${endOfYear}
        GROUP BY to_char("paymentDate", 'YYYY-MM')
        ORDER BY month
      `,
      prisma.payment.findMany({
        where: {
          ...feeWhere,
          status: "COMPLETED",
          paymentDate: { gte: startOfYear, lte: endOfYear },
        },
        include: {
          studentFee: {
            include: {
              fee: {
                include: { feeType: true },
              },
            },
          },
        },
        take: 100,
      }),
    ]);

    // Group payments by fee type
    const feeTypeCounts: Record<string, number> = {};
    for (const payment of paymentsByFeeType) {
      const feeTypeName = payment.studentFee?.fee?.feeType?.name || payment.studentFee?.fee?.name || "Unknown";
      feeTypeCounts[feeTypeName] = (feeTypeCounts[feeTypeName] || 0) + Number(payment.amount);
    }
    const byType = Object.entries(feeTypeCounts)
      .map(([type, collected]) => ({ type, collected }))
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 10);

    // Process monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const found = paymentsByMonth.find(p => p.month === monthKey);
      return {
        month: date.toLocaleString("default", { month: "short" }),
        collected: found ? Number(found.collected) : 0,
        outstanding: found ? Number(found.outstanding) : 0,
      };
    });

    // Users stats
    const userWhere = schoolId ? { schoolId } : {};
    const [usersTotal, usersByRole] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.userRole.groupBy({
        by: ["roleId"],
        where: { user: { ...userWhere } },
        _count: { userId: true },
      }),
    ]);

    // Get role names
    const roleIds = usersByRole.map(r => r.roleId);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
    const roleNameMap = new Map(roles.map(r => [r.id, r.name]));
    const byRole = usersByRole.map(r => ({
      role: roleNameMap.get(r.roleId) || "Unknown",
      count: r._count.userId,
    }));

    return {
      schools: {
        total: schoolsTotal,
        active: schoolsActive,
        byYear,
      },
      students: {
        total: studentsTotal,
        active: studentsActive,
        bySchool: studentsBySchoolFormatted,
      },
      fees: {
        totalCollected: Number(paymentsThisYear._sum.amount || 0),
        totalOutstanding: Number(studentFeesPending._sum.balanceAmount || 0),
        byMonth: monthlyData,
        byType,
      },
      users: {
        total: usersTotal,
        byRole,
      },
    };
  },

  /** Get audit logs with filtering */
  async findLogs(query: {
    page: number;
    limit: number;
    action?: string;
    entityType?: string;
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page, limit, action, entityType, schoolId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { startsWith: action, mode: "insensitive" };
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get logs with school info, then fetch actor info separately
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          school: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Fetch actor users for logs that have actorUserId
    const actorUserIds = [...new Set(logs.map(l => l.actorUserId).filter(Boolean) as string[])];
    const actors = actorUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorUserIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map(a => [a.id, a]));

    const items = logs.map(log => ({
      ...log,
      actor: log.actorUserId ? actorMap.get(log.actorUserId) || null : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** List all roles across all schools (for developer panel) */
  async findRoles(query: {
    page: number;
    limit: number;
    search?: string;
    isSystem?: boolean;
    schoolId?: string;
  }) {
    const { page, limit, search, isSystem, schoolId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = {};
    if (schoolId) where.schoolId = schoolId;
    if (isSystem !== undefined) where.isSystem = isSystem;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: { permission: true },
          },
          school: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.role.count({ where }),
    ]);

    // Transform permissions from nested objects to flat array of permission keys
    const transformedItems = items.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => rp.permission.key),
    }));

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** Get role by ID */
  async findRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        school: { select: { id: true, name: true, code: true } },
      },
    });

    if (!role) return null;

    // Transform permissions from nested objects to flat array of permission keys
    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission.key),
    };
  },

  /** Create a new role (always school-scoped, isSystem indicates system-defined) */
  async createRole(data: {
    schoolId: string;
    name: string;
    description?: string;
    isSystem: boolean;
    permissions: string[];
  }) {
    return prisma.role.create({
      data: {
        school: { connect: { id: data.schoolId } },
        name: data.name,
        description: data.description,
        isSystem: data.isSystem,
        permissions: {
          create: data.permissions.map((key) => ({
            permission: { connect: { key } },
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
        school: { select: { id: true, name: true, code: true } },
      },
    });
  },

  /** Update a role */
  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return null;

    // Update basic info
    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        permissions: { include: { permission: true } },
        school: { select: { id: true, name: true, code: true } },
      },
    });

    // Sync permissions if provided
    if (data.permissions) {
      const permissionIds = await prisma.permission.findMany({
        where: { key: { in: data.permissions } },
        select: { id: true },
      });
      const ids = permissionIds.map((p) => p.id);

      await prisma.rolePermission.deleteMany({
        where: { roleId: id, permissionId: { notIn: ids } },
      });
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId) => ({ roleId: id, permissionId })),
        skipDuplicates: true,
      });

      return prisma.role.findUnique({
        where: { id },
        include: {
          permissions: { include: { permission: true } },
          school: { select: { id: true, name: true, code: true } },
        },
      });
    }

    return updated;
  },

  /** Delete a role */
  async deleteRole(id: string) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return false;

    if (existing.isSystem) {
      throw new Error("Cannot delete system role");
    }

    const userRoles = await prisma.userRole.count({ where: { roleId: id } });
    if (userRoles > 0) {
      throw new Error("Cannot delete role assigned to users");
    }

    await prisma.role.delete({ where: { id } });
    return true;
  },
};
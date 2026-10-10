import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListDeveloperUsersQuery } from "./developer-users.schemas.js";

export const developerUsersRepository = {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
      include: {
        school: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async findByEmailInSchool(schoolId: string, email: string) {
    return prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email } },
      include: {
        school: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async findMany(query: ListDeveloperUsersQuery) {
    const { page = 1, limit = 20, search, schoolId, roleId, isActive, sortBy = "createdAt", sortOrder = "desc" } = query;
    const where: Prisma.UserWhereInput = {};

    if (schoolId) where.schoolId = schoolId;
    if (roleId) where.roles = { some: { roleId } };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, code: true } },
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        school: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  async syncRoles(userId: string, roleIds: string[]) {
    // Delete existing roles not in the new list
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: { notIn: roleIds },
      },
    });

    // Add new roles
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });

    // Return updated user with roles
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },

  async getSchools() {
    return prisma.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  },

  async getRoles(schoolId: string) {
    return prisma.role.findMany({
      where: { schoolId },
      select: { id: true, name: true, description: true, isSystem: true },
      orderBy: { name: "asc" },
    });
  },
};

export type DeveloperUsersRepository = typeof developerUsersRepository;
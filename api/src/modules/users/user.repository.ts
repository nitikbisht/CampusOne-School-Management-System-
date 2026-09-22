import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListUsersQuery } from "./user.schemas.js";

export const userRepository = {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async findByEmail(schoolId: string, email: string) {
    return prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email } },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
  },

  async findMany(schoolId: string, query: ListUsersQuery) {
    const { page = 1, limit = 20, search, isActive } = query;
    const where: Prisma.UserWhereInput = {
      schoolId,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          },
        },
        orderBy: { createdAt: "desc" },
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
};

export type UserRepository = typeof userRepository;
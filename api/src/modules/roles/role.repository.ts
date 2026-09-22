import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListRolesQuery } from "./role.schemas.js";

export const roleRepository = {
  async create(data: Prisma.RoleCreateInput) {
    return prisma.role.create({ data });
  },

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  },

  async findMany(schoolId: string, query: ListRolesQuery) {
    const { page = 1, limit = 20, search } = query;
    const where: Prisma.RoleWhereInput = {
      schoolId,
    };

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
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.role.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.RoleUpdateInput) {
    return prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.role.delete({ where: { id } });
  },

  async findByName(schoolId: string, name: string) {
    return prisma.role.findUnique({
      where: { schoolId_name: { schoolId, name } },
    });
  },

  async syncPermissions(roleId: string, permissionKeys: string[]) {
    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    const permissionIds = permissions.map((p) => p.id);

    // Delete existing permissions not in the new list
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { notIn: permissionIds },
      },
    });

    // Add new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });

    // Return updated role with permissions
    return prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  },
};

export type RoleRepository = typeof roleRepository;
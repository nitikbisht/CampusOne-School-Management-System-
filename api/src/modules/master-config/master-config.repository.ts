import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListConfigTemplatesQuery } from "./master-config.schemas.js";

export const masterConfigRepository = {
  async create(data: Prisma.ConfigTemplateCreateInput) {
    return prisma.configTemplate.create({ data });
  },

  async findById(id: string) {
    return prisma.configTemplate.findUnique({ where: { id } });
  },

  async findMany(query: ListConfigTemplatesQuery) {
    const { page = 1, limit = 20, search, isActive } = query;
    const where: Prisma.ConfigTemplateWhereInput = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.configTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.configTemplate.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.ConfigTemplateUpdateInput) {
    return prisma.configTemplate.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.configTemplate.delete({ where: { id } });
  },

  async clone(id: string, newName: string) {
    const original = await prisma.configTemplate.findUnique({ where: { id } });
    if (!original) throw new Error("Config template not found");

    return prisma.configTemplate.create({
      data: {
        name: newName,
        description: original.description,
        template: original.template as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  },
};

export type MasterConfigRepository = typeof masterConfigRepository;
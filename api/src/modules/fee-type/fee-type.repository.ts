import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListFeeTypesQuery } from "./fee-type.schemas.js";

export const feeTypeRepository = {
  async create(data: Prisma.FeeTypeCreateInput) {
    return prisma.feeType.create({ data });
  },

  async findById(id: string) {
    return prisma.feeType.findUnique({
      where: { id },
    });
  },

  async findMany(schoolId: string, query: ListFeeTypesQuery) {
    const { page = 1, limit = 20, isActive, search } = query;
    const where: Prisma.FeeTypeWhereInput = {
      schoolId,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.feeType.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feeType.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.FeeTypeUpdateInput) {
    return prisma.feeType.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.feeType.delete({ where: { id } });
  },

  async findByName(schoolId: string, name: string, excludeId?: string) {
    return prisma.feeType.findFirst({
      where: {
        schoolId,
        name,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },
};

export type FeeTypeRepository = typeof feeTypeRepository;
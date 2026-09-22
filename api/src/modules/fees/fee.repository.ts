import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListFeesQuery } from "./fee.schemas.js";

export const feeRepository = {
  async create(data: Prisma.FeeCreateInput) {
    return prisma.fee.create({ data });
  },

  async findById(id: string) {
    return prisma.fee.findUnique({
      where: { id },
      include: {
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });
  },

  async findMany(schoolId: string, query: ListFeesQuery) {
    const { page = 1, limit = 20, academicYearId, classId, isActive, search } = query;
    const where: Prisma.FeeWhereInput = {
      schoolId,
    };

    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          academicYear: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fee.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.FeeUpdateInput) {
    return prisma.fee.update({
      where: { id },
      data,
      include: {
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.fee.delete({ where: { id } });
  },
};

export type FeeRepository = typeof feeRepository;
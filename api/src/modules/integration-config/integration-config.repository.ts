import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListIntegrationConfigsQuery } from "./integration-config.schemas.js";

export const integrationConfigRepository = {
  async create(data: Prisma.IntegrationConfigCreateInput) {
    return prisma.integrationConfig.create({ data });
  },

  async findById(id: string) {
    return prisma.integrationConfig.findUnique({ where: { id } });
  },

  async findByKey(key: string) {
    return prisma.integrationConfig.findUnique({ where: { key } });
  },

  async findMany(query: ListIntegrationConfigsQuery) {
    const { page = 1, limit = 20, search, isActive } = query;
    const where: Prisma.IntegrationConfigWhereInput = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.integrationConfig.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.integrationConfig.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.IntegrationConfigUpdateInput) {
    return prisma.integrationConfig.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.integrationConfig.delete({ where: { id } });
  },

  async updateTestResult(id: string, success: boolean, result?: string) {
    return prisma.integrationConfig.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: result ?? (success ? "success" : "failed"),
      },
    });
  },
};

export type IntegrationConfigRepository = typeof integrationConfigRepository;
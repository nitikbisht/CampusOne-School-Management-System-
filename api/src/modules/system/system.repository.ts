import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListFeatureFlagsQuery, ListApiConfigsQuery } from "./system.schemas.js";

export const systemRepository = {
  // Feature Flags
  async createFeatureFlag(data: Prisma.FeatureFlagCreateInput) {
    return prisma.featureFlag.create({ data });
  },

  async findFeatureFlagById(id: string) {
    return prisma.featureFlag.findUnique({ where: { id } });
  },

  async findFeatureFlagByKey(key: string, schoolId?: string) {
    return prisma.featureFlag.findFirst({
      where: { key, schoolId: schoolId ?? null },
    });
  },

  async findFeatureFlags(query: ListFeatureFlagsQuery) {
    const { page = 1, limit = 20, search, enabled, scope } = query;
    const where: Prisma.FeatureFlagWhereInput = {};

    if (enabled !== undefined) where.enabled = enabled;
    if (scope) where.scope = scope;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.featureFlag.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { school: { select: { id: true, name: true } } },
      }),
      prisma.featureFlag.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updateFeatureFlag(id: string, data: Prisma.FeatureFlagUpdateInput) {
    return prisma.featureFlag.update({
      where: { id },
      data,
    });
  },

  async deleteFeatureFlag(id: string) {
    return prisma.featureFlag.delete({ where: { id } });
  },

  // API Configs (using a generic model or we can add a new one)
  async findManyApiConfigs(query: ListApiConfigsQuery) {
    // For now, return empty - will need a model for this
    return {
      items: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: 0,
    };
  },
};

export type SystemRepository = typeof systemRepository;
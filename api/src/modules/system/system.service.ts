import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { systemRepository } from "./system.repository.js";
import { auditService } from "../../lib/audit.js";
import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import type { CreateFeatureFlagInput, UpdateFeatureFlagInput, ListFeatureFlagsQuery } from "./system.schemas.js";

export const systemService = {
  // Feature Flags
  async listFeatureFlags(query: ListFeatureFlagsQuery) {
    return systemRepository.findFeatureFlags(query);
  },

  async getFeatureFlag(id: string) {
    const flag = await systemRepository.findFeatureFlagById(id);
    if (!flag) {
      throw AppError.notFound("Feature flag not found");
    }
    return flag;
  },

  async getFeatureFlagByKey(key: string, schoolId?: string) {
    return systemRepository.findFeatureFlagByKey(key, schoolId);
  },

  async createFeatureFlag(input: CreateFeatureFlagInput, req: Request) {
    // Check if key already exists for the scope
    const existing = await systemRepository.findFeatureFlagByKey(input.key, input.schoolId);
    if (existing) {
      throw AppError.conflict("A feature flag with this key already exists for this scope");
    }

    const createData: Prisma.FeatureFlagCreateInput = {
      key: input.key,
      name: input.name,
      description: input.description,
      enabled: input.enabled,
      scope: input.scope,
    };

    // Use relation syntax for schoolId if provided
    if (input.schoolId) {
      createData.school = { connect: { id: input.schoolId } };
    }

    const flag = await systemRepository.createFeatureFlag(createData);

    await auditService.logFromRequest(
      req,
      "CREATE",
      "FeatureFlag",
      flag.id,
      { oldValue: null, newValue: { key: flag.key, name: flag.name, enabled: flag.enabled, scope: flag.scope } },
      undefined,
      "Feature flag created"
    );

    return flag;
  },

  async updateFeatureFlag(id: string, input: UpdateFeatureFlagInput, req: Request) {
    const existing = await systemRepository.findFeatureFlagById(id);
    if (!existing) {
      throw AppError.notFound("Feature flag not found");
    }

    const updated = await systemRepository.updateFeatureFlag(id, input);

    await auditService.logFromRequest(
      req,
      "UPDATE",
      "FeatureFlag",
      id,
      {
        oldValue: { name: existing.name, enabled: existing.enabled, scope: existing.scope },
        newValue: input,
      },
      undefined,
      "Feature flag updated"
    );

    return updated;
  },

  async deleteFeatureFlag(id: string, req: Request) {
    const existing = await systemRepository.findFeatureFlagById(id);
    if (!existing) {
      throw AppError.notFound("Feature flag not found");
    }

    await systemRepository.deleteFeatureFlag(id);

    await auditService.logFromRequest(
      req,
      "DELETE",
      "FeatureFlag",
      id,
      { oldValue: { key: existing.key, name: existing.name }, newValue: null },
      undefined,
      "Feature flag deleted"
    );
  },

  // System Health
  async getSystemHealth() {
    // Check database connectivity
    let dbStatus = "healthy";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "unhealthy";
    }

    // Check Redis if used (placeholder)
    const redisStatus = "not_configured";

    return {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: dbStatus, latency: dbLatency },
        redis: { status: redisStatus },
      },
    };
  },

  // API Configs (placeholder)
  async listApiConfigs() {
    return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  },
};

export type SystemService = typeof systemService;
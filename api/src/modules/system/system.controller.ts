import { Request, Response } from "express";
import { systemService } from "./system.service.js";

/**
 * System Controller
 * Handles HTTP requests for system monitoring, feature flags, API config
 */
export const systemController = {
  /**
   * GET /api/v1/developer/system/health
   * Get system health status
   */
  async getHealth(req: Request, res: Response) {
    const health = await systemService.getSystemHealth();
    res.json({
      success: true,
      data: health,
    });
  },

  /**
   * GET /api/v1/developer/system/feature-flags
   * List all feature flags
   */
  async listFeatureFlags(req: Request, res: Response) {
    const { page = 1, limit = 20, search, enabled, scope } = req.query;
    const query = {
      page: Number(page),
      limit: Number(limit),
      search: search as string | undefined,
      enabled: enabled !== undefined ? enabled === "true" : undefined,
      scope: scope as "GLOBAL" | "PER_SCHOOL" | undefined,
    };

    const result = await systemService.listFeatureFlags(query);
    res.json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/developer/system/feature-flags/:id
   * Get single feature flag
   */
  async getFeatureFlag(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const flag = await systemService.getFeatureFlag(id);
    res.json({
      success: true,
      data: flag,
    });
  },

  /**
   * POST /api/v1/developer/system/feature-flags
   * Create a new feature flag
   */
  async createFeatureFlag(req: Request, res: Response) {
    const flag = await systemService.createFeatureFlag(req.body, req);
    res.status(201).json({
      success: true,
      data: flag,
      message: "Feature flag created successfully",
    });
  },

  /**
   * PATCH /api/v1/developer/system/feature-flags/:id
   * Update feature flag
   */
  async updateFeatureFlag(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const flag = await systemService.updateFeatureFlag(id, req.body, req);
    res.json({
      success: true,
      data: flag,
      message: "Feature flag updated successfully",
    });
  },

  /**
   * DELETE /api/v1/developer/system/feature-flags/:id
   * Delete feature flag
   */
  async deleteFeatureFlag(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await systemService.deleteFeatureFlag(id, req);
    res.json({
      success: true,
      message: "Feature flag deleted successfully",
    });
  },

  /**
   * GET /api/v1/developer/system/api-configs
   * List API configurations
   */
  async listApiConfigs(req: Request, res: Response) {
    const result = await systemService.listApiConfigs();
    res.json({
      success: true,
      data: result,
    });
  },
};

export type SystemController = typeof systemController;
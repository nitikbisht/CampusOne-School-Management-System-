import { Request, Response } from "express";
import { integrationConfigService } from "./integration-config.service.js";
import { maskConfig } from "../../lib/encryption.js";

/**
 * Integration Config Controller
 * Handles HTTP requests for integration configurations (SMTP, SMS, Payment, etc.)
 */
export const integrationConfigController = {
  /**
   * GET /api/v1/developer/integrations
   * List all integration configs with pagination and filters
   */
  async listConfigs(req: Request, res: Response) {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {
      page: Number(page),
      limit: Number(limit),
      search: search as string | undefined,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    };

    const result = await integrationConfigService.listConfigs(query);

    // Mask sensitive config data in response
    const maskedItems = result.items.map((config) => {
      try {
        const decrypted = JSON.parse(config.config as string);
        return { ...config, config: maskConfig(decrypted) };
      } catch {
        // If not encrypted or parsing fails, mask the raw config
        return { ...config, config: maskConfig(config.config as Record<string, unknown>) };
      }
    });

    res.json({
      success: true,
      data: {
        ...result,
        items: maskedItems,
      },
    });
  },

  /**
   * GET /api/v1/developer/integrations/:id
   * Get single integration config (with masked sensitive values)
   */
  async getConfig(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const masked = await integrationConfigService.getConfigMasked(id);
    res.json({
      success: true,
      data: masked,
    });
  },

  /**
   * POST /api/v1/developer/integrations
   * Create a new integration config
   */
  async createConfig(req: Request, res: Response) {
    const config = await integrationConfigService.createConfig(req.body, req);
    res.status(201).json({
      success: true,
      data: config,
      message: "Integration config created successfully",
    });
  },

  /**
   * PATCH /api/v1/developer/integrations/:id
   * Update integration config
   */
  async updateConfig(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const config = await integrationConfigService.updateConfig(id, req.body, req);
    res.json({
      success: true,
      data: config,
      message: "Integration config updated successfully",
    });
  },

  /**
   * DELETE /api/v1/developer/integrations/:id
   * Delete integration config
   */
  async deleteConfig(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await integrationConfigService.deleteConfig(id, req);
    res.json({
      success: true,
      message: "Integration config deleted successfully",
    });
  },

  /**
   * POST /api/v1/developer/integrations/:id/test
   * Test integration connection
   */
  async testConfig(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await integrationConfigService.testConfig(id, req.body, req);
    res.json({
      success: true,
      data: result,
    });
  },
};

export type IntegrationConfigController = typeof integrationConfigController;
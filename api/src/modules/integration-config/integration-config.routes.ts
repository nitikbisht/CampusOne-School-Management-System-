import { Router } from "express";
import { integrationConfigController } from "./integration-config.controller.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { z } from "zod";

const router = Router();

// All routes require authentication and developer access
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

// Query/param schemas (for validate middleware)
const listQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
};

const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

const createBodySchema = {
  body: z.object({
    key: z.enum([
      "smtp",
      "sms_twilio",
      "sms_msg91",
      "payment_razorpay",
      "payment_stripe",
      "storage_s3",
      "storage_gcs",
      "oauth_google",
      "oauth_microsoft",
    ]),
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    config: z.record(z.string(), z.unknown()),
    isActive: z.boolean().default(false),
  }),
};

const updateBodySchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    config: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  }),
};

const testBodySchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    config: z.record(z.string(), z.unknown()).optional(),
  }),
};

/**
 * @route GET /api/v1/developer/integrations
 * @description List all integration configs
 * @permission INTEGRATION_VIEW
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.INTEGRATION_VIEW),
  validate(listQuerySchema),
  integrationConfigController.listConfigs
);

/**
 * @route GET /api/v1/developer/integrations/:id
 * @description Get single integration config (masked)
 * @permission INTEGRATION_VIEW
 */
router.get(
  "/:id",
  requirePermission(PERMISSIONS.INTEGRATION_VIEW),
  validate(idParamSchema),
  integrationConfigController.getConfig
);

/**
 * @route POST /api/v1/developer/integrations
 * @description Create a new integration config
 * @permission INTEGRATION_CREATE
 */
router.post(
  "/",
  requirePermission(PERMISSIONS.INTEGRATION_CREATE),
  validate(createBodySchema),
  integrationConfigController.createConfig
);

/**
 * @route PATCH /api/v1/developer/integrations/:id
 * @description Update integration config
 * @permission INTEGRATION_UPDATE
 */
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.INTEGRATION_UPDATE),
  validate(updateBodySchema),
  integrationConfigController.updateConfig
);

/**
 * @route DELETE /api/v1/developer/integrations/:id
 * @description Delete integration config
 * @permission INTEGRATION_DELETE
 */
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.INTEGRATION_DELETE),
  validate(idParamSchema),
  integrationConfigController.deleteConfig
);

/**
 * @route POST /api/v1/developer/integrations/:id/test
 * @description Test integration connection
 * @permission INTEGRATION_TEST
 */
router.post(
  "/:id/test",
  requirePermission(PERMISSIONS.INTEGRATION_TEST),
  validate(testBodySchema),
  integrationConfigController.testConfig
);

export default router;
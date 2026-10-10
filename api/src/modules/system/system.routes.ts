import { Router } from "express";
import { systemController } from "./system.controller.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { z } from "zod";

const router = Router();

// All routes require authentication and developer access
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

// Query/param schemas
const healthQuerySchema = {
  query: z.object({}),
};

const featureFlagListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    enabled: z.coerce.boolean().optional(),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).optional(),
  }),
};

const featureFlagIdSchema = {
  params: z.object({ id: z.string().uuid() }),
};

const createFeatureFlagSchema = {
  body: z.object({
    key: z.enum([
      "new_fee_module",
      "new_exam_module",
      "advanced_reports",
      "parent_portal",
      "mobile_app",
      "bulk_operations",
      "ai_insights",
      "attendance_biometric",
      "online_exams",
      "fee_online_payment",
    ]),
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    enabled: z.boolean().default(false),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).default("GLOBAL"),
    schoolId: z.string().uuid().optional(),
  }),
};

const updateFeatureFlagSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    enabled: z.boolean().optional(),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).optional(),
    schoolId: z.string().uuid().optional().nullable(),
  }),
};

const apiConfigListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
  }),
};

/**
 * @route GET /api/v1/developer/system/health
 * @description Get system health status
 * @permission SYSTEM_VIEW
 */
router.get(
  "/health",
  requirePermission(PERMISSIONS.SYSTEM_VIEW),
  validate(healthQuerySchema),
  systemController.getHealth
);

/**
 * @route GET /api/v1/developer/system/feature-flags
 * @description List all feature flags
 * @permission FEATURE_FLAG_VIEW
 */
router.get(
  "/feature-flags",
  requirePermission(PERMISSIONS.FEATURE_FLAG_VIEW),
  validate(featureFlagListSchema),
  systemController.listFeatureFlags
);

/**
 * @route GET /api/v1/developer/system/feature-flags/:id
 * @description Get single feature flag
 * @permission FEATURE_FLAG_VIEW
 */
router.get(
  "/feature-flags/:id",
  requirePermission(PERMISSIONS.FEATURE_FLAG_VIEW),
  validate(featureFlagIdSchema),
  systemController.getFeatureFlag
);

/**
 * @route POST /api/v1/developer/system/feature-flags
 * @description Create a new feature flag
 * @permission FEATURE_FLAG_CREATE
 */
router.post(
  "/feature-flags",
  requirePermission(PERMISSIONS.FEATURE_FLAG_CREATE),
  validate(createFeatureFlagSchema),
  systemController.createFeatureFlag
);

/**
 * @route PATCH /api/v1/developer/system/feature-flags/:id
 * @description Update feature flag
 * @permission FEATURE_FLAG_UPDATE
 */
router.patch(
  "/feature-flags/:id",
  requirePermission(PERMISSIONS.FEATURE_FLAG_UPDATE),
  validate(updateFeatureFlagSchema),
  systemController.updateFeatureFlag
);

/**
 * @route DELETE /api/v1/developer/system/feature-flags/:id
 * @description Delete feature flag
 * @permission FEATURE_FLAG_DELETE
 */
router.delete(
  "/feature-flags/:id",
  requirePermission(PERMISSIONS.FEATURE_FLAG_DELETE),
  validate(featureFlagIdSchema),
  systemController.deleteFeatureFlag
);

/**
 * @route GET /api/v1/developer/system/api-configs
 * @description List API configurations
 * @permission SYSTEM_VIEW
 */
router.get(
  "/api-configs",
  requirePermission(PERMISSIONS.SYSTEM_VIEW),
  validate(apiConfigListSchema),
  systemController.listApiConfigs
);

export default router;
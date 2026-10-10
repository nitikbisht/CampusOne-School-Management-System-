import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { masterConfigController } from "./master-config.controller.js";
import {
  idParamSchema,
  createConfigTemplateSchema,
  updateConfigTemplateSchema,
  listConfigTemplatesQuerySchema,
} from "./master-config.schemas.js";

export const masterConfigRoutes = Router();

// All routes require authentication and developer access
masterConfigRoutes.use(authenticate);
masterConfigRoutes.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

/**
 * @route   GET /api/v1/developer/masters
 * @desc    List all config templates
 * @access  Developer
 */
masterConfigRoutes.get(
  "/",
  requirePermission(PERMISSIONS.MASTER_VIEW),
  validate({ query: listConfigTemplatesQuerySchema.shape.query }),
  masterConfigController.list
);

/**
 * @route   POST /api/v1/developer/masters
 * @desc    Create config template
 * @access  Developer
 */
masterConfigRoutes.post(
  "/",
  requirePermission(PERMISSIONS.MASTER_CREATE),
  validate({ body: createConfigTemplateSchema.shape.body }),
  masterConfigController.create
);

/**
 * @route   GET /api/v1/developer/masters/:id
 * @desc    Get single config template
 * @access  Developer
 */
masterConfigRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.MASTER_VIEW),
  validate({ params: idParamSchema }),
  masterConfigController.get
);

/**
 * @route   PATCH /api/v1/developer/masters/:id
 * @desc    Update config template
 * @access  Developer
 */
masterConfigRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.MASTER_UPDATE),
  validate({ params: idParamSchema, body: updateConfigTemplateSchema.shape.body }),
  masterConfigController.update
);

/**
 * @route   DELETE /api/v1/developer/masters/:id
 * @desc    Deactivate config template (soft delete) or hard delete with ?hard=true
 * @access  Developer
 */
masterConfigRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.MASTER_DELETE),
  validate({ params: idParamSchema, query: z.object({ hard: z.string().optional() }) }),
  masterConfigController.delete
);

/**
 * @route   POST /api/v1/developer/masters/:id/clone
 * @desc    Clone config template
 * @access  Developer
 */
masterConfigRoutes.post(
  "/:id/clone",
  requirePermission(PERMISSIONS.MASTER_CREATE),
  validate({ params: idParamSchema, body: z.object({ name: z.string().min(1).max(200).trim() }) }),
  masterConfigController.clone
);
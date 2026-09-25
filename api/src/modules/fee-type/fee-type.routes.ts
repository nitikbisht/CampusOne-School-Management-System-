import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { feeTypeController } from "./fee-type.controller.js";
import { createFeeTypeSchema, updateFeeTypeSchema, listFeeTypesQuerySchema, idParamSchema } from "./fee-type.schemas.js";

export const feeTypeRoutes = Router();

// All routes require authentication
feeTypeRoutes.use(authenticate);

// List fee types
feeTypeRoutes.get(
  "/",
  requirePermission(PERMISSIONS.FEE_TYPE_VIEW),
  validate({ query: listFeeTypesQuerySchema.shape.query }),
  feeTypeController.list,
);

// Create fee type
feeTypeRoutes.post(
  "/",
  requirePermission(PERMISSIONS.FEE_TYPE_CREATE),
  validate({ body: createFeeTypeSchema.shape.body }),
  feeTypeController.create,
);

// Get single fee type
feeTypeRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.FEE_TYPE_VIEW),
  validate({ params: idParamSchema }),
  feeTypeController.get,
);

// Update fee type
feeTypeRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.FEE_TYPE_UPDATE),
  validate({ params: idParamSchema, body: updateFeeTypeSchema.shape.body }),
  feeTypeController.update,
);

// Delete fee type
feeTypeRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.FEE_TYPE_DELETE),
  validate({ params: idParamSchema }),
  feeTypeController.delete,
);
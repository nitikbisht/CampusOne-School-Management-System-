import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { feeController } from "./fee.controller.js";
import { createFeeSchema, updateFeeSchema, listFeesQuerySchema, idParamSchema } from "./fee.schemas.js";

export const feeRoutes = Router();

// All routes require authentication
feeRoutes.use(authenticate);

// List fees
feeRoutes.get(
  "/",
  requirePermission(PERMISSIONS.FEE_VIEW),
  validate({ query: listFeesQuerySchema.shape.query }),
  feeController.list,
);

// Create fee
feeRoutes.post(
  "/",
  requirePermission(PERMISSIONS.FEE_CREATE),
  validate({ body: createFeeSchema.shape.body }),
  feeController.create,
);

// Get single fee
feeRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.FEE_VIEW),
  validate({ params: idParamSchema }),
  feeController.get,
);

// Update fee
feeRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.FEE_UPDATE),
  validate({ params: idParamSchema, body: updateFeeSchema.shape.body }),
  feeController.update,
);

// Delete fee
feeRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.FEE_DELETE),
  validate({ params: idParamSchema }),
  feeController.delete,
);
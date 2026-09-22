import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { roleController } from "./role.controller.js";
import { createRoleSchema, updateRoleSchema, listRolesQuerySchema, idParamSchema } from "./role.schemas.js";

export const roleRoutes = Router();

// All routes require authentication
roleRoutes.use(authenticate);

// List roles
roleRoutes.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  validate({ query: listRolesQuerySchema.shape.query }),
  roleController.list,
);

// Create role
roleRoutes.post(
  "/",
  requirePermission(PERMISSIONS.ROLE_CREATE),
  validate({ body: createRoleSchema.shape.body }),
  roleController.create,
);

// Get single role
roleRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  validate({ params: idParamSchema }),
  roleController.get,
);

// Update role
roleRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validate({ params: idParamSchema, body: updateRoleSchema.shape.body }),
  roleController.update,
);

// Delete role
roleRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_DELETE),
  validate({ params: idParamSchema }),
  roleController.delete,
);
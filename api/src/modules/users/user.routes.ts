import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { userController } from "./user.controller.js";
import { createUserSchema, updateUserSchema, listUsersQuerySchema, idParamSchema, changePasswordSchema } from "./user.schemas.js";

export const userRoutes = Router();

// All routes require authentication
userRoutes.use(authenticate);

// List users
userRoutes.get(
  "/",
  requirePermission(PERMISSIONS.USER_VIEW),
  validate({ query: listUsersQuerySchema.shape.query }),
  userController.list,
);

// Create user
userRoutes.post(
  "/",
  requirePermission(PERMISSIONS.USER_CREATE),
  validate({ body: createUserSchema.shape.body }),
  userController.create,
);

// Get single user
userRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.USER_VIEW),
  validate({ params: idParamSchema }),
  userController.get,
);

// Update user
userRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate({ params: idParamSchema, body: updateUserSchema.shape.body }),
  userController.update,
);

// Delete user
userRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.USER_DELETE),
  validate({ params: idParamSchema }),
  userController.delete,
);

// Change password
userRoutes.post(
  "/:id/change-password",
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate({ params: idParamSchema, body: changePasswordSchema.shape.body }),
  userController.changePassword,
);
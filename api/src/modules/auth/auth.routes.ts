import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { authController } from "./auth.controller.js";
import { loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "./auth.schemas.js";

export const authRoutes = Router();

// Public routes (no authentication required)
authRoutes.post(
  "/login",
  validate({ body: loginSchema }),
  authController.login,
);

authRoutes.post(
  "/refresh",
  validate({ body: refreshSchema }),
  authController.refresh,
);

authRoutes.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

authRoutes.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

// Protected routes (authentication required)
authRoutes.use(authenticate);

authRoutes.post(
  "/logout",
  authController.logout,
);

authRoutes.get(
  "/me",
  authController.me,
);

authRoutes.post(
  "/change-password",
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

// Admin-only routes for user/role management (to be implemented)
authRoutes.get(
  "/users",
  requirePermission(PERMISSIONS.USER_VIEW),
  async (_req, res) => {
    res.json({ data: [], message: "Not implemented yet" });
  },
);

authRoutes.get(
  "/roles",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  async (_req, res) => {
    res.json({ data: [], message: "Not implemented yet" });
  },
);

authRoutes.get(
  "/permissions",
  requirePermission(PERMISSIONS.PERMISSION_LIST),
  async (_req, res) => {
    res.json({ data: [], message: "Not implemented yet" });
  },
);
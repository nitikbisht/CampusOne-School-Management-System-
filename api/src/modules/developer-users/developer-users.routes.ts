import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { developerUsersController } from "./developer-users.controller.js";
import {
  idParamSchema,
  createDeveloperUserSchema,
  updateDeveloperUserSchema,
  listDeveloperUsersQuerySchema,
  resetPasswordSchema,
  bulkActionSchema,
} from "./developer-users.schemas.js";

export const developerUsersRoutes = Router();

// All routes require authentication and developer access
developerUsersRoutes.use(authenticate);
developerUsersRoutes.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

/**
 * @route   GET /api/v1/developer/users
 * @desc    List users across all schools
 * @access  Developer
 */
developerUsersRoutes.get(
  "/",
  requirePermission(PERMISSIONS.DEVELOPER_USER_VIEW),
  validate({ query: listDeveloperUsersQuerySchema.shape.query }),
  developerUsersController.list
);

/**
 * @route   GET /api/v1/developer/users/schools
 * @desc    Get all active schools for dropdown
 * @access  Developer
 */
developerUsersRoutes.get(
  "/schools",
  requirePermission(PERMISSIONS.DEVELOPER_USER_VIEW),
  developerUsersController.getSchools
);

/**
 * @route   GET /api/v1/developer/users/roles
 * @desc    Get roles for a specific school
 * @access  Developer
 */
developerUsersRoutes.get(
  "/roles",
  requirePermission(PERMISSIONS.DEVELOPER_USER_VIEW),
  validate({ query: z.object({ schoolId: z.uuid() }) }),
  developerUsersController.getRoles
);

/**
 * @route   POST /api/v1/developer/users
 * @desc    Create user in any school
 * @access  Developer
 */
developerUsersRoutes.post(
  "/",
  requirePermission(PERMISSIONS.DEVELOPER_USER_CREATE),
  validate({ body: createDeveloperUserSchema.shape.body }),
  developerUsersController.create
);

/**
 * @route   GET /api/v1/developer/users/:id
 * @desc    Get single user with school and roles
 * @access  Developer
 */
developerUsersRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.DEVELOPER_USER_VIEW),
  validate({ params: idParamSchema }),
  developerUsersController.get
);

/**
 * @route   PATCH /api/v1/developer/users/:id
 * @desc    Update user (including moving between schools)
 * @access  Developer
 */
developerUsersRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.DEVELOPER_USER_UPDATE),
  validate({ params: idParamSchema, body: updateDeveloperUserSchema.shape.body }),
  developerUsersController.update
);

/**
 * @route   DELETE /api/v1/developer/users/:id
 * @desc    Deactivate user (soft delete) or hard delete with ?hard=true
 * @access  Developer
 */
developerUsersRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.DEVELOPER_USER_DELETE),
  validate({ params: idParamSchema, query: z.object({ hard: z.string().optional() }) }),
  developerUsersController.delete
);

/**
 * @route   POST /api/v1/developer/users/bulk
 * @desc    Bulk action on users (activate, deactivate, delete)
 * @access  Developer
 */
developerUsersRoutes.post(
  "/bulk",
  requirePermission(PERMISSIONS.DEVELOPER_USER_MANAGE),
  validate({ body: bulkActionSchema.shape.body }),
  developerUsersController.bulkAction
);

/**
 * @route   POST /api/v1/developer/users/:id/reset-password
 * @desc    Reset user password
 * @access  Developer
 */
developerUsersRoutes.post(
  "/:id/reset-password",
  requirePermission(PERMISSIONS.DEVELOPER_USER_PASSWORD_RESET),
  validate({ params: idParamSchema, body: resetPasswordSchema.shape.body }),
  developerUsersController.resetPassword
);
import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { developerController } from "./developer.controller.js";
import { schoolOnboardingRoutes } from "../school-onboarding/school-onboarding.routes.js";
import { developerUsersRoutes } from "../developer-users/developer-users.routes.js";
import { masterConfigRoutes } from "../master-config/master-config.routes.js";
import integrationConfigRoutes from "../integration-config/integration-config.routes.js";
import systemRoutes from "../system/system.routes.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  listSchoolsQuerySchema,
  dashboardQuerySchema,
  listLogsQuerySchema,
  roleListQuerySchema,
  roleIdSchema,
  createRoleSchema,
  updateRoleSchema,
} from "./developer.schemas.js";

export const developerRoutes = Router();

// Public endpoint for current school (any authenticated user)
developerRoutes.get("/current-school", authenticate, developerController.getCurrentSchool);

// All other developer routes require authentication and Developer role
developerRoutes.use(authenticate);
developerRoutes.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

// Schools list (must come BEFORE schoolOnboardingRoutes to avoid route conflict with /:id)
developerRoutes.get("/schools", validate({ query: listSchoolsQuerySchema }), developerController.listSchools);

// School onboarding (check uniqueness, onboard, school details, update, status)
developerRoutes.use("/schools", schoolOnboardingRoutes);

// Developer users (cross-school user management)
developerRoutes.use("/users", developerUsersRoutes);

// Master Configuration
developerRoutes.use("/masters", masterConfigRoutes);

// Integration Configuration
developerRoutes.use("/integrations", integrationConfigRoutes);

// System (health, feature flags, API config)
developerRoutes.use("/system", systemRoutes);

// Role & Permission Management
developerRoutes.get("/roles", validate({ query: roleListQuerySchema }), requirePermission(PERMISSIONS.ROLE_VIEW), developerController.listRoles);
developerRoutes.get("/roles/:id", validate({ params: roleIdSchema }), requirePermission(PERMISSIONS.ROLE_VIEW), developerController.getRole);
developerRoutes.post("/roles", validate({ body: createRoleSchema }), requirePermission(PERMISSIONS.ROLE_CREATE), developerController.createRole);
developerRoutes.patch("/roles/:id", validate({ params: roleIdSchema, body: updateRoleSchema }), requirePermission(PERMISSIONS.ROLE_UPDATE), developerController.updateRole);
developerRoutes.delete("/roles/:id", validate({ params: roleIdSchema }), requirePermission(PERMISSIONS.ROLE_DELETE), developerController.deleteRole);

// Dashboard
developerRoutes.get("/dashboard", validate({ query: dashboardQuerySchema }), developerController.getDashboard);

// Audit logs
developerRoutes.get("/logs", validate({ query: listLogsQuerySchema }), developerController.listLogs);
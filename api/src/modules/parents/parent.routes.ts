import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { parentController } from "./parent.controller.js";
import { createParentSchema, updateParentSchema, idParamSchema, listParentsQuerySchema, linkChildSchema } from "./parent.schemas.js";

export const parentRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
parentRoutes.use(authenticate);

parentRoutes.get(
  "/",
  requirePermission(PERMISSIONS.PARENT_VIEW),
  validate({ query: listParentsQuerySchema }),
  parentController.list,
);

parentRoutes.post(
  "/",
  requirePermission(PERMISSIONS.PARENT_CREATE),
  validate({ body: createParentSchema }),
  parentController.create,
);

parentRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.PARENT_VIEW),
  validate({ params: idParamSchema }),
  parentController.get,
);

parentRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.PARENT_UPDATE),
  validate({ params: idParamSchema, body: updateParentSchema }),
  parentController.update,
);

parentRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.PARENT_DELETE),
  validate({ params: idParamSchema }),
  parentController.delete,
);

// Parent-Student relationship routes
parentRoutes.post(
  "/:id/children",
  requirePermission(PERMISSIONS.PARENT_UPDATE),
  validate({ params: idParamSchema, body: linkChildSchema }),
  parentController.linkChild,
);

parentRoutes.delete(
  "/:id/children/:studentId",
  requirePermission(PERMISSIONS.PARENT_UPDATE),
  validate({ params: z.object({ id: z.uuid(), studentId: z.uuid() }) }),
  parentController.unlinkChild,
);

parentRoutes.get(
  "/:id/children",
  requirePermission(PERMISSIONS.PARENT_VIEW),
  validate({ params: idParamSchema }),
  parentController.getChildren,
);

parentRoutes.get(
  "/students/:studentId/parents",
  requirePermission(PERMISSIONS.STUDENT_VIEW),
  validate({ params: z.object({ studentId: z.uuid() }) }),
  parentController.getParents,
);
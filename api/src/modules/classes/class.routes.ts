import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { classController } from "./class.controller.js";
import { createClassSchema, updateClassSchema, idParamSchema } from "./class.schemas.js";

export const classRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
classRoutes.use(authenticate);

classRoutes.get(
  "/",
  requirePermission(PERMISSIONS.CLASS_VIEW),
  classController.list,
);

classRoutes.post(
  "/",
  requirePermission(PERMISSIONS.CLASS_CREATE),
  validate({ body: createClassSchema }),
  classController.create,
);

classRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_VIEW),
  validate({ params: idParamSchema }),
  classController.get,
);

classRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_UPDATE),
  validate({ params: idParamSchema, body: updateClassSchema }),
  classController.update,
);

classRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_DELETE),
  validate({ params: idParamSchema }),
  classController.delete,
);
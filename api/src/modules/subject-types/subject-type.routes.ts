import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { subjectTypeController } from "./subject-type.controller.js";
import { createSubjectTypeSchema, updateSubjectTypeSchema, idParamSchema } from "./subject-type.schemas.js";

export const subjectTypeRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
subjectTypeRoutes.use(authenticate);

subjectTypeRoutes.get(
  "/",
  requirePermission(PERMISSIONS.SUBJECT_TYPE_VIEW),
  subjectTypeController.list,
);

subjectTypeRoutes.post(
  "/",
  requirePermission(PERMISSIONS.SUBJECT_TYPE_CREATE),
  validate({ body: createSubjectTypeSchema }),
  subjectTypeController.create,
);

subjectTypeRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_TYPE_VIEW),
  validate({ params: idParamSchema }),
  subjectTypeController.get,
);

subjectTypeRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_TYPE_UPDATE),
  validate({ params: idParamSchema, body: updateSubjectTypeSchema }),
  subjectTypeController.update,
);

subjectTypeRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_TYPE_DELETE),
  validate({ params: idParamSchema }),
  subjectTypeController.delete,
);
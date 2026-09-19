import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { subjectController } from "./subject.controller.js";
import { createSubjectSchema, updateSubjectSchema, idParamSchema } from "./subject.schemas.js";

export const subjectRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
subjectRoutes.use(authenticate);

subjectRoutes.get(
  "/",
  requirePermission(PERMISSIONS.SUBJECT_VIEW),
  subjectController.list,
);

subjectRoutes.post(
  "/",
  requirePermission(PERMISSIONS.SUBJECT_CREATE),
  validate({ body: createSubjectSchema }),
  subjectController.create,
);

subjectRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_VIEW),
  validate({ params: idParamSchema }),
  subjectController.get,
);

subjectRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_UPDATE),
  validate({ params: idParamSchema, body: updateSubjectSchema }),
  subjectController.update,
);

subjectRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.SUBJECT_DELETE),
  validate({ params: idParamSchema }),
  subjectController.delete,
);
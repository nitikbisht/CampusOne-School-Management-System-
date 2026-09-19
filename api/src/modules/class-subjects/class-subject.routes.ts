import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { classSubjectController } from "./class-subject.controller.js";
import { createClassSubjectSchema, updateClassSubjectSchema, idParamSchema } from "./class-subject.schemas.js";

export const classSubjectRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
classSubjectRoutes.use(authenticate);

classSubjectRoutes.get(
  "/",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_VIEW),
  classSubjectController.list,
);

classSubjectRoutes.get(
  "/class/:classId",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_VIEW),
  validate({ params: z.object({ classId: z.uuid() }) }),
  classSubjectController.listByClass,
);

classSubjectRoutes.post(
  "/",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_CREATE),
  validate({ body: createClassSubjectSchema }),
  classSubjectController.create,
);

classSubjectRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_VIEW),
  validate({ params: idParamSchema }),
  classSubjectController.get,
);

classSubjectRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_UPDATE),
  validate({ params: idParamSchema, body: updateClassSubjectSchema }),
  classSubjectController.update,
);

classSubjectRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.CLASS_SUBJECT_DELETE),
  validate({ params: idParamSchema }),
  classSubjectController.delete,
);
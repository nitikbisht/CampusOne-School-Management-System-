import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { enrollmentController } from "./enrollment.controller.js";
import { createEnrollmentSchema, updateEnrollmentSchema, idParamSchema, listEnrollmentsQuerySchema } from "./enrollment.schemas.js";

export const enrollmentRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
enrollmentRoutes.use(authenticate);

enrollmentRoutes.get(
  "/",
  requirePermission(PERMISSIONS.STUDENT_ENROLLMENT_VIEW),
  validate({ query: listEnrollmentsQuerySchema }),
  enrollmentController.list,
);

enrollmentRoutes.post(
  "/",
  requirePermission(PERMISSIONS.STUDENT_ENROLLMENT_CREATE),
  validate({ body: createEnrollmentSchema }),
  enrollmentController.create,
);

enrollmentRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_ENROLLMENT_VIEW),
  validate({ params: idParamSchema }),
  enrollmentController.get,
);

enrollmentRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_ENROLLMENT_UPDATE),
  validate({ params: idParamSchema, body: updateEnrollmentSchema }),
  enrollmentController.update,
);

enrollmentRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_ENROLLMENT_DELETE),
  validate({ params: idParamSchema }),
  enrollmentController.delete,
);
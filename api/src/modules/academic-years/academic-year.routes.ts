import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { academicYearController } from "./academic-year.controller.js";
import { createAcademicYearSchema, idParamSchema } from "./academic-year.schemas.js";

export const academicYearRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
academicYearRoutes.use(authenticate);

academicYearRoutes.get(
  "/",
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_VIEW),
  academicYearController.list,
);

academicYearRoutes.post(
  "/",
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_CREATE),
  validate({ body: createAcademicYearSchema }),
  academicYearController.create,
);

academicYearRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_VIEW),
  validate({ params: idParamSchema }),
  academicYearController.get,
);

academicYearRoutes.post(
  "/:id/activate",
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_MANAGE),
  validate({ params: idParamSchema }),
  academicYearController.activate,
);

import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { sectionController } from "./section.controller.js";
import { createSectionSchema, updateSectionSchema, idParamSchema } from "./section.schemas.js";

export const sectionRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
sectionRoutes.use(authenticate);

sectionRoutes.get(
  "/",
  requirePermission(PERMISSIONS.SECTION_VIEW),
  sectionController.list,
);

sectionRoutes.get(
  "/academic-year/:academicYearId",
  requirePermission(PERMISSIONS.SECTION_VIEW),
  validate({ params: z.object({ academicYearId: z.uuid() }) }),
  sectionController.listByAcademicYear,
);

sectionRoutes.post(
  "/",
  requirePermission(PERMISSIONS.SECTION_CREATE),
  validate({ body: createSectionSchema }),
  sectionController.create,
);

sectionRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.SECTION_VIEW),
  validate({ params: idParamSchema }),
  sectionController.get,
);

sectionRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.SECTION_UPDATE),
  validate({ params: idParamSchema, body: updateSectionSchema }),
  sectionController.update,
);

sectionRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.SECTION_DELETE),
  validate({ params: idParamSchema }),
  sectionController.delete,
);
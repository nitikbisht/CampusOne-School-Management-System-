import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { studentController } from "./student.controller.js";
import { createStudentSchema, updateStudentSchema, idParamSchema, listStudentsQuerySchema } from "./student.schemas.js";

export const studentRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
studentRoutes.use(authenticate);

studentRoutes.get(
  "/",
  requirePermission(PERMISSIONS.STUDENT_VIEW),
  validate({ query: listStudentsQuerySchema }),
  studentController.list,
);

studentRoutes.post(
  "/",
  requirePermission(PERMISSIONS.STUDENT_CREATE),
  validate({ body: createStudentSchema }),
  studentController.create,
);

studentRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_VIEW),
  validate({ params: idParamSchema }),
  studentController.get,
);

studentRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_UPDATE),
  validate({ params: idParamSchema, body: updateStudentSchema }),
  studentController.update,
);

studentRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_DELETE),
  validate({ params: idParamSchema }),
  studentController.delete,
);
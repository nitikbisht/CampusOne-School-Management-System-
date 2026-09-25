import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { studentFeeController } from "./student-fee.controller.js";
import {
  createStudentFeeSchema,
  bulkAssignStudentFeeSchema,
  updateStudentFeeSchema,
  listStudentFeesQuerySchema,
  idParamSchema,
} from "./student-fee.schemas.js";

const studentIdParamsSchema = z.object({ studentId: z.uuid() });
const studentIdQuerySchema = z.object({ academicYearId: z.uuid().optional() });
const summaryParamsSchema = z.object({ studentId: z.uuid(), academicYearId: z.uuid() });

export const studentFeeRoutes = Router();

// All routes require authentication
studentFeeRoutes.use(authenticate);

// List student fees
studentFeeRoutes.get(
  "/",
  requirePermission(PERMISSIONS.STUDENT_FEE_VIEW),
  validate({ query: listStudentFeesQuerySchema.shape.query }),
  studentFeeController.list,
);

// Bulk assign fees to students
studentFeeRoutes.post(
  "/bulk-assign",
  requirePermission(PERMISSIONS.STUDENT_FEE_BULK_ASSIGN),
  validate({ body: bulkAssignStudentFeeSchema.shape.body }),
  studentFeeController.bulkAssign,
);

// Create single student fee
studentFeeRoutes.post(
  "/",
  requirePermission(PERMISSIONS.STUDENT_FEE_CREATE),
  validate({ body: createStudentFeeSchema.shape.body }),
  studentFeeController.create,
);

// Get student fees for a specific student
studentFeeRoutes.get(
  "/student/:studentId",
  requirePermission(PERMISSIONS.STUDENT_FEE_VIEW),
  validate({ params: studentIdParamsSchema, query: studentIdQuerySchema }),
  studentFeeController.listByStudent,
);

// Get fee summary for a student
studentFeeRoutes.get(
  "/summary/:studentId/:academicYearId",
  requirePermission(PERMISSIONS.STUDENT_FEE_VIEW),
  validate({ params: summaryParamsSchema }),
  studentFeeController.getSummary,
);

// Get single student fee
studentFeeRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_FEE_VIEW),
  validate({ params: idParamSchema }),
  studentFeeController.get,
);

// Update student fee
studentFeeRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_FEE_UPDATE),
  validate({ params: idParamSchema, body: updateStudentFeeSchema.shape.body }),
  studentFeeController.update,
);

// Delete student fee
studentFeeRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_FEE_DELETE),
  validate({ params: idParamSchema }),
  studentFeeController.delete,
);
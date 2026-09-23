import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { studentMarkController } from "./student-mark.controller.js";
import {
  idParamSchema,
  createStudentMarkSchema,
  updateStudentMarkSchema,
  listStudentMarksQuerySchema,
  bulkStudentMarksSchema,
  bulkPublishMarksSchema,
} from "./student-mark.schemas.js";

export const studentMarkRoutes = Router();

// Order matters: authenticate -> permission -> validate -> controller
studentMarkRoutes.use(authenticate);

// List with filters
studentMarkRoutes.get(
  "/",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ query: listStudentMarksQuerySchema }),
  studentMarkController.list
);

// Get single
studentMarkRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ params: idParamSchema }),
  studentMarkController.get
);

// Create single
studentMarkRoutes.post(
  "/",
  requirePermission(PERMISSIONS.STUDENT_MARK_CREATE),
  validate({ body: createStudentMarkSchema }),
  studentMarkController.create
);

// Update single
studentMarkRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_MARK_UPDATE),
  validate({ params: idParamSchema, body: updateStudentMarkSchema }),
  studentMarkController.update
);

// Delete single
studentMarkRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.STUDENT_MARK_DELETE),
  validate({ params: idParamSchema }),
  studentMarkController.delete
);

// Bulk upsert marks for an exam subject
studentMarkRoutes.post(
  "/bulk",
  requirePermission(PERMISSIONS.STUDENT_MARK_CREATE),
  validate({ body: bulkStudentMarksSchema }),
  studentMarkController.bulkUpsert
);

// Bulk publish marks
studentMarkRoutes.post(
  "/bulk-publish",
  requirePermission(PERMISSIONS.STUDENT_MARK_MANAGE),
  validate({ body: bulkPublishMarksSchema }),
  studentMarkController.bulkPublish
);

// Get mark sheet for an exam subject
studentMarkRoutes.get(
  "/by-exam-subject/:examSubjectId",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ params: z.object({ examSubjectId: z.uuid() }) }),
  studentMarkController.getByExamSubject
);

// Get marks for a student (report card)
studentMarkRoutes.get(
  "/by-student/:studentId",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ params: z.object({ studentId: z.uuid() }), query: z.object({ academicYearId: z.uuid().optional() }) }),
  studentMarkController.getByStudent
);

// Get consolidated marks for class/section/exam
studentMarkRoutes.get(
  "/consolidated/:examId/:classId/:sectionId",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ params: z.object({ examId: z.uuid(), classId: z.uuid(), sectionId: z.uuid() }) }),
  studentMarkController.getConsolidated
);

// Validation status for an exam subject
studentMarkRoutes.get(
  "/validation/:examSubjectId",
  requirePermission(PERMISSIONS.STUDENT_MARK_VIEW),
  validate({ params: z.object({ examSubjectId: z.uuid() }) }),
  studentMarkController.getValidationStatus
);
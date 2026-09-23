import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { examController } from "./exam.controller.js";
import {
  idParamSchema,
  createExamSchema,
  updateExamSchema,
  listExamsQuerySchema,
  createExamSubjectSchema,
  updateExamSubjectSchema,
  listExamSubjectsQuerySchema,
  createExamAssessmentComponentSchema,
  updateExamAssessmentComponentSchema,
  listExamAssessmentComponentsQuerySchema,
  createExamScheduleSchema,
  updateExamScheduleSchema,
  listExamSchedulesQuerySchema,
} from "./exam.schemas.js";

export const examRoutes = Router();

examRoutes.use(authenticate);

// Exam routes
examRoutes.get(
  "/",
  requirePermission("exam:view"),
  validate({ query: listExamsQuerySchema }),
  examController.list
);

examRoutes.get(
  "/by-academic-year/:academicYearId",
  requirePermission("exam:view"),
  examController.getByAcademicYear
);

examRoutes.get(
  "/by-class-section",
  requirePermission("exam:view"),
  examController.getByClassSection
);

examRoutes.get(
  "/:id",
  requirePermission("exam:view"),
  validate({ params: idParamSchema }),
  examController.getById
);

examRoutes.post(
  "/",
  requirePermission("exam:create"),
  validate({ body: createExamSchema }),
  examController.create
);

examRoutes.patch(
  "/:id",
  requirePermission("exam:update"),
  validate({ params: idParamSchema, body: updateExamSchema }),
  examController.update
);

examRoutes.post(
  "/:id/publish",
  requirePermission("exam:manage"),
  validate({ params: idParamSchema }),
  examController.publish
);

examRoutes.delete(
  "/:id",
  requirePermission("exam:delete"),
  validate({ params: idParamSchema }),
  examController.delete
);

// ExamSubject routes
examRoutes.get(
  "/subjects",
  requirePermission("exam:view"),
  validate({ query: listExamSubjectsQuerySchema }),
  examController.listSubjects
);

examRoutes.get(
  "/subjects/:id",
  requirePermission("exam:view"),
  validate({ params: idParamSchema }),
  examController.getSubjectById
);

examRoutes.post(
  "/subjects",
  requirePermission("exam:create"),
  validate({ body: createExamSubjectSchema }),
  examController.createSubject
);

examRoutes.patch(
  "/subjects/:id",
  requirePermission("exam:update"),
  validate({ params: idParamSchema, body: updateExamSubjectSchema }),
  examController.updateSubject
);

examRoutes.delete(
  "/subjects/:id",
  requirePermission("exam:delete"),
  validate({ params: idParamSchema }),
  examController.deleteSubject
);

// ExamAssessmentComponent routes
examRoutes.get(
  "/components",
  requirePermission("exam:view"),
  validate({ query: listExamAssessmentComponentsQuerySchema }),
  examController.listComponents
);

examRoutes.get(
  "/components/:id",
  requirePermission("exam:view"),
  validate({ params: idParamSchema }),
  examController.getComponentById
);

examRoutes.post(
  "/components",
  requirePermission("exam:create"),
  validate({ body: createExamAssessmentComponentSchema }),
  examController.createComponent
);

examRoutes.patch(
  "/components/:id",
  requirePermission("exam:update"),
  validate({ params: idParamSchema, body: updateExamAssessmentComponentSchema }),
  examController.updateComponent
);

examRoutes.delete(
  "/components/:id",
  requirePermission("exam:delete"),
  validate({ params: idParamSchema }),
  examController.deleteComponent
);

// ExamSchedule routes
examRoutes.get(
  "/schedules",
  requirePermission("exam:view"),
  validate({ query: listExamSchedulesQuerySchema }),
  examController.listSchedules
);

examRoutes.get(
  "/schedules/:id",
  requirePermission("exam:view"),
  validate({ params: idParamSchema }),
  examController.getScheduleById
);

examRoutes.post(
  "/schedules",
  requirePermission("exam:create"),
  validate({ body: createExamScheduleSchema }),
  examController.createSchedule
);

examRoutes.patch(
  "/schedules/:id",
  requirePermission("exam:update"),
  validate({ params: idParamSchema, body: updateExamScheduleSchema }),
  examController.updateSchedule
);

examRoutes.delete(
  "/schedules/:id",
  requirePermission("exam:delete"),
  validate({ params: idParamSchema }),
  examController.deleteSchedule
);
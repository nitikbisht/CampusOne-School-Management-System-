import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

// Exam schemas
export const createExamSchema = z.object({
  academicYearId: z.uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = z.object({
  academicYearId: z.uuid().optional(),
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateExamInput = z.infer<typeof updateExamSchema>;

export const listExamsQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListExamsQuery = z.infer<typeof listExamsQuerySchema>;

// ExamSubject schemas
export const createExamSubjectSchema = z.object({
  examId: z.uuid(),
  subjectId: z.uuid(),
  classId: z.uuid(),
  maxMarks: z.number().int().min(1).default(100),
  passMarks: z.number().int().min(0).default(33),
  weightage: z.number().min(0).default(1.0),
});

export type CreateExamSubjectInput = z.infer<typeof createExamSubjectSchema>;

export const updateExamSubjectSchema = z.object({
  subjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  maxMarks: z.number().int().min(1).optional(),
  passMarks: z.number().int().min(0).optional(),
  weightage: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExamSubjectInput = z.infer<typeof updateExamSubjectSchema>;

export const listExamSubjectsQuerySchema = z.object({
  examId: z.uuid().optional(),
  subjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListExamSubjectsQuery = z.infer<typeof listExamSubjectsQuerySchema>;

// ExamAssessmentComponent schemas
export const createExamAssessmentComponentSchema = z.object({
  examSubjectId: z.uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  type: z.enum(["THEORY", "PRACTICAL", "INTERNAL", "PROJECT", "VIVA", "OTHER"]).default("THEORY"),
  maxMarks: z.number().int().min(1).default(100),
  passMarks: z.number().int().min(0).default(33),
  weightage: z.number().min(0).default(1.0),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreateExamAssessmentComponentInput = z.infer<typeof createExamAssessmentComponentSchema>;

export const updateExamAssessmentComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  type: z.enum(["THEORY", "PRACTICAL", "INTERNAL", "PROJECT", "VIVA", "OTHER"]).optional(),
  maxMarks: z.number().int().min(1).optional(),
  passMarks: z.number().int().min(0).optional(),
  weightage: z.number().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExamAssessmentComponentInput = z.infer<typeof updateExamAssessmentComponentSchema>;

export const listExamAssessmentComponentsQuerySchema = z.object({
  examSubjectId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListExamAssessmentComponentsQuery = z.infer<typeof listExamAssessmentComponentsQuerySchema>;

// ExamSchedule schemas
export const createExamScheduleSchema = z.object({
  examId: z.uuid(),
  examSubjectId: z.uuid(),
  classId: z.uuid(),
  sectionId: z.uuid().optional(),
  date: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  roomId: z.uuid().optional(),
  invigilatorId: z.uuid().optional(),
  notes: z.string().optional(),
});

export type CreateExamScheduleInput = z.infer<typeof createExamScheduleSchema>;

export const updateExamScheduleSchema = z.object({
  examSubjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  date: z.iso.date().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  roomId: z.uuid().optional(),
  invigilatorId: z.uuid().optional(),
  notes: z.string().optional(),
});

export type UpdateExamScheduleInput = z.infer<typeof updateExamScheduleSchema>;

export const listExamSchedulesQuerySchema = z.object({
  examId: z.uuid().optional(),
  examSubjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  date: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListExamSchedulesQuery = z.infer<typeof listExamSchedulesQuerySchema>;
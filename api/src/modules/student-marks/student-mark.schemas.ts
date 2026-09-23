import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

// Create Student Mark
export const createStudentMarkSchema = z.object({
  studentId: z.uuid(),
  academicYearId: z.uuid(),
  examId: z.uuid(),
  examSubjectId: z.uuid(),
  assessmentCompId: z.uuid(),
  marksObtained: z.number().nullable().optional(),
  isAbsent: z.boolean().default(false),
  isDraft: z.boolean().default(true),
});

export type CreateStudentMarkInput = z.infer<typeof createStudentMarkSchema>;

// Update Student Mark
export const updateStudentMarkSchema = z.object({
  marksObtained: z.number().nullable().optional(),
  isAbsent: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  enteredById: z.uuid().optional(),
});

export type UpdateStudentMarkInput = z.infer<typeof updateStudentMarkSchema>;

// List Query
export const listStudentMarksQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  examId: z.uuid().optional(),
  examSubjectId: z.uuid().optional(),
  studentId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  isDraft: z.boolean().optional(),
  isAbsent: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListStudentMarksQuery = z.infer<typeof listStudentMarksQuerySchema>;

// Bulk Create/Update
export const bulkStudentMarksSchema = z.object({
  examSubjectId: z.uuid(),
  marks: z.array(
    z.object({
      studentId: z.uuid(),
      assessmentCompId: z.uuid(),
      marksObtained: z.number().nullable().optional(),
      isAbsent: z.boolean().default(false),
      isDraft: z.boolean().default(true),
    })
  ).min(1),
});

export type BulkStudentMarksInput = z.infer<typeof bulkStudentMarksSchema>;

// Bulk Publish
export const bulkPublishMarksSchema = z.object({
  examSubjectId: z.uuid(),
  assessmentCompIds: z.array(z.uuid()).optional(), // if not provided, publish all components
});

export type BulkPublishMarksInput = z.infer<typeof bulkPublishMarksSchema>;
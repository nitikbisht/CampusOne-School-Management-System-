import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createAssignmentSchema = z.object({
  teacherId: z.uuid(),
  academicYearId: z.uuid(),
  subjectId: z.uuid(),
  classId: z.uuid(),
  sectionId: z.uuid(),
  isPrimary: z.boolean().default(true).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  subjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  isPrimary: z.boolean().optional(),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export const listAssignmentsQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  teacherId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  subjectId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
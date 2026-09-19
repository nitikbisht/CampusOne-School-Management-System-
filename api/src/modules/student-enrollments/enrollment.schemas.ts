import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createEnrollmentSchema = z.object({
  studentId: z.uuid(),
  academicYearId: z.uuid(),
  classId: z.uuid(),
  sectionId: z.uuid(),
  rollNumber: z.int().min(1).optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  rollNumber: z.int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;

export const listEnrollmentsQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  studentId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
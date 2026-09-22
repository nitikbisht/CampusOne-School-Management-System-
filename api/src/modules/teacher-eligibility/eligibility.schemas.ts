import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createEligibilitySchema = z.object({
  teacherId: z.uuid(),
  subjectId: z.uuid(),
  classId: z.uuid(),
  maxClassId: z.uuid().optional(),
});

export type CreateEligibilityInput = z.infer<typeof createEligibilitySchema>;

export const updateEligibilitySchema = z.object({
  subjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  maxClassId: z.uuid().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEligibilityInput = z.infer<typeof updateEligibilitySchema>;

export const listEligibilitiesQuerySchema = z.object({
  teacherId: z.uuid().optional(),
  subjectId: z.uuid().optional(),
  classId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListEligibilitiesQuery = z.infer<typeof listEligibilitiesQuerySchema>;
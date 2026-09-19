import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createSectionSchema = z.object({
  academicYearId: z.uuid(),
  classId: z.uuid(),
  name: z.string().trim().min(1).max(50),
  capacity: z.int().min(1).optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  capacity: z.int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
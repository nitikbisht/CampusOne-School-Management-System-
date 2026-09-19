import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createSubjectTypeSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export type CreateSubjectTypeInput = z.infer<typeof createSubjectTypeSchema>;

export const updateSubjectTypeSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
});

export type UpdateSubjectTypeInput = z.infer<typeof updateSubjectTypeSchema>;
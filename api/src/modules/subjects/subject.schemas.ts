import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createSubjectSchema = z.object({
  subjectTypeId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(20).regex(/^[A-Z0-9-]+$/),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z.object({
  subjectTypeId: z.uuid().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().min(1).max(20).regex(/^[A-Z0-9-]+$/).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
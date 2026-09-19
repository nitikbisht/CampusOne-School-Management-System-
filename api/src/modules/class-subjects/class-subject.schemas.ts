import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createClassSubjectSchema = z.object({
  classId: z.uuid(),
  subjectId: z.uuid(),
});

export type CreateClassSubjectInput = z.infer<typeof createClassSubjectSchema>;

export const updateClassSubjectSchema = z.object({
  classId: z.uuid().optional(),
  subjectId: z.uuid().optional(),
});

export type UpdateClassSubjectInput = z.infer<typeof updateClassSubjectSchema>;
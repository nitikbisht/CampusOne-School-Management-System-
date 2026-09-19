import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(50),
  displayOrder: z.int().min(0).default(0),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  displayOrder: z.int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;
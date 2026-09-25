import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createFeeTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateFeeTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: idParamSchema,
});

export const listFeeTypesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    isActive: z.coerce.boolean().optional(),
    search: z.string().max(100).optional(),
  }),
});

export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>["body"];
export type UpdateFeeTypeInput = z.infer<typeof updateFeeTypeSchema>["body"];
export type ListFeeTypesQuery = z.infer<typeof listFeeTypesQuerySchema>["query"];
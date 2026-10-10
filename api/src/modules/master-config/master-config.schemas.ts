import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createConfigTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    template: z.record(z.string(), z.unknown()), // JSON template for fee types, roles, academic structure, etc.
  }),
});

export const updateConfigTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    template: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  }),
  params: idParamSchema,
});

export const listConfigTemplatesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export type CreateConfigTemplateInput = z.infer<typeof createConfigTemplateSchema>["body"];
export type UpdateConfigTemplateInput = z.infer<typeof updateConfigTemplateSchema>["body"];
export type ListConfigTemplatesQuery = z.infer<typeof listConfigTemplatesQuerySchema>["query"];
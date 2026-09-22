import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).trim(),
    description: z.string().max(500).optional(),
    permissions: z.array(z.string()).default([]),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    permissions: z.array(z.string()).optional(),
  }),
  params: idParamSchema,
});

export const listRolesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
  }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>["body"];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>["body"];
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>["query"];
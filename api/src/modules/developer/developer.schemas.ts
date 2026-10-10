import { z } from "zod";

/** Query params for listing schools */
export const listSchoolsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type ListSchoolsQuery = z.infer<typeof listSchoolsQuerySchema>;

/** Query params for dashboard */
export const dashboardQuerySchema = z.object({
  schoolId: z.string().uuid(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/** Query params for logs */
export const listLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().optional(),
  entityType: z.string().optional(),
  schoolId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;

/** Query params for listing roles */
export const roleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  isSystem: z.coerce.boolean().optional(),
  schoolId: z.string().uuid(),
});

export type RoleListQuery = z.infer<typeof roleListQuerySchema>;

/** Role ID param */
export const roleIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type RoleIdParams = z.infer<typeof roleIdSchema>["params"];

/** Create role body */
export const createRoleSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    isSystem: z.boolean().default(false),
    permissions: z.array(z.string()).default([]),
  }),
});

export type CreateRoleBody = z.infer<typeof createRoleSchema>["body"];

/** Update role body */
export const updateRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    permissions: z.array(z.string()).optional(),
  }),
});

export type UpdateRoleParams = z.infer<typeof updateRoleSchema>["params"];
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>["body"];
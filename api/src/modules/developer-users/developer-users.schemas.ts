import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createDeveloperUserSchema = z.object({
  body: z.object({
    schoolId: z.uuid(),
    email: z.email().toLowerCase().trim(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().default(true),
    roleIds: z.array(z.uuid()).default([]),
    sendInvite: z.boolean().default(true),
  }),
});

export const updateDeveloperUserSchema = z.object({
  body: z.object({
    email: z.email().toLowerCase().trim().optional(),
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    phone: z.string().max(20).optional().nullable(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.uuid()).optional(),
    schoolId: z.uuid().optional(), // Allow moving user to different school
  }),
  params: idParamSchema,
});

export const listDeveloperUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    schoolId: z.uuid().optional(),
    roleId: z.uuid().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(["createdAt", "email", "firstName", "lastName", "lastLoginAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8).max(128).optional(), // If not provided, generate temp password
    sendEmail: z.boolean().default(true),
  }),
  params: idParamSchema,
});

export const bulkActionSchema = z.object({
  body: z.object({
    userIds: z.array(z.uuid()).min(1).max(100),
    action: z.enum(["activate", "deactivate", "delete"]),
  }),
});

export type CreateDeveloperUserInput = z.infer<typeof createDeveloperUserSchema>["body"];
export type UpdateDeveloperUserInput = z.infer<typeof updateDeveloperUserSchema>["body"];
export type ListDeveloperUsersQuery = z.infer<typeof listDeveloperUsersQuerySchema>["query"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type BulkActionInput = z.infer<typeof bulkActionSchema>["body"];
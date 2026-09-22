import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createUserSchema = z.object({
  body: z.object({
    email: z.email().toLowerCase().trim(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().default(true),
    roleIds: z.array(z.uuid()).default([]),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.email().toLowerCase().trim().optional(),
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    phone: z.string().max(20).optional().nullable(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.uuid()).optional(),
  }),
  params: idParamSchema,
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  }).refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
  params: idParamSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>["query"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
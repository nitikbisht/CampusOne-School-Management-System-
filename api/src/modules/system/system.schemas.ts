import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

// Feature Flag schemas
export const featureFlagKeySchema = z.enum([
  "new_fee_module",
  "new_exam_module",
  "advanced_reports",
  "parent_portal",
  "mobile_app",
  "bulk_operations",
  "ai_insights",
  "attendance_biometric",
  "online_exams",
  "fee_online_payment",
]);

export const createFeatureFlagSchema = z.object({
  body: z.object({
    key: featureFlagKeySchema,
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    enabled: z.boolean().default(false),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).default("GLOBAL"),
    schoolId: z.string().uuid().optional(),
  }),
});

export const updateFeatureFlagSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    enabled: z.boolean().optional(),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).optional(),
    schoolId: z.string().uuid().optional().nullable(),
  }),
});

export const listFeatureFlagsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    enabled: z.coerce.boolean().optional(),
    scope: z.enum(["GLOBAL", "PER_SCHOOL"]).optional(),
  }),
});

// API Config schemas
export const createApiConfigSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(100).trim(),
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    rateLimit: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateApiConfigSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    rateLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listApiConfigsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
  }),
});

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>["body"];
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>["body"];
export type ListFeatureFlagsQuery = z.infer<typeof listFeatureFlagsQuerySchema>["query"];
export type CreateApiConfigInput = z.infer<typeof createApiConfigSchema>["body"];
export type UpdateApiConfigInput = z.infer<typeof updateApiConfigSchema>["body"];
export type ListApiConfigsQuery = z.infer<typeof listApiConfigsQuerySchema>["query"];
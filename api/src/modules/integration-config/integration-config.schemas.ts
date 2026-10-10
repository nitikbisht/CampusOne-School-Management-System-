import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

// Supported integration types
export const integrationKeySchema = z.enum([
  "smtp",
  "sms_twilio",
  "sms_msg91",
  "payment_razorpay",
  "payment_stripe",
  "storage_s3",
  "storage_gcs",
  "oauth_google",
  "oauth_microsoft",
]);

export const createIntegrationConfigSchema = z.object({
  key: integrationKeySchema,
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  config: z.record(z.string(), z.unknown()), // Will be encrypted
  isActive: z.boolean().default(false),
});

export const updateIntegrationConfigSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const listIntegrationConfigsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const testIntegrationSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(), // Test with provided config or use stored
});

export type CreateIntegrationConfigInput = z.infer<typeof createIntegrationConfigSchema>;
export type UpdateIntegrationConfigInput = z.infer<typeof updateIntegrationConfigSchema>;
export type ListIntegrationConfigsQuery = z.infer<typeof listIntegrationConfigsQuerySchema>;
export type TestIntegrationInput = z.infer<typeof testIntegrationSchema>;
import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const feeFrequencySchema = z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "SEMESTER", "ANNUAL"]);

export const createFeeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    amount: z.number().positive().max(999999.99),
    frequency: feeFrequencySchema,
    academicYearId: z.uuid(),
    classId: z.uuid().optional(),
    dueDate: z.iso.date().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateFeeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    amount: z.number().positive().max(999999.99).optional(),
    frequency: feeFrequencySchema.optional(),
    academicYearId: z.uuid().optional(),
    classId: z.uuid().optional().nullable(),
    dueDate: z.iso.date().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: idParamSchema,
});

export const listFeesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    academicYearId: z.uuid().optional(),
    classId: z.uuid().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().max(100).optional(),
  }),
});

export type CreateFeeInput = z.infer<typeof createFeeSchema>["body"];
export type UpdateFeeInput = z.infer<typeof updateFeeSchema>["body"];
export type ListFeesQuery = z.infer<typeof listFeesQuerySchema>["query"];
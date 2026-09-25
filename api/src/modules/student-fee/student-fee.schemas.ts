import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createStudentFeeSchema = z.object({
  body: z.object({
    studentId: z.uuid(),
    feeId: z.uuid(),
    academicYearId: z.uuid(),
    discountAmount: z.number().min(0).max(999999.99).optional().default(0),
    discountReason: z.string().max(500).optional().nullable(),
    dueDate: z.iso.date().optional().nullable(),
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED", "CANCELLED"]).default("PENDING"),
  }),
});

export const bulkAssignStudentFeeSchema = z.object({
  body: z.object({
    feeId: z.uuid(),
    academicYearId: z.uuid(),
    studentIds: z.array(z.uuid()).min(1).max(200),
    discountAmount: z.number().min(0).max(999999.99).optional().default(0),
    discountReason: z.string().max(500).optional().nullable(),
    dueDate: z.iso.date().optional().nullable(),
  }),
});

export const updateStudentFeeSchema = z.object({
  body: z.object({
    discountAmount: z.number().min(0).max(999999.99).optional(),
    discountReason: z.string().max(500).optional().nullable(),
    dueDate: z.iso.date().optional().nullable(),
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED", "CANCELLED"]).optional(),
  }),
  params: idParamSchema,
});

export const listStudentFeesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    studentId: z.uuid().optional(),
    feeId: z.uuid().optional(),
    academicYearId: z.uuid().optional(),
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED", "CANCELLED"]).optional(),
    search: z.string().max(100).optional(),
  }),
});

export type CreateStudentFeeInput = z.infer<typeof createStudentFeeSchema>["body"];
export type BulkAssignStudentFeeInput = z.infer<typeof bulkAssignStudentFeeSchema>["body"];
export type UpdateStudentFeeInput = z.infer<typeof updateStudentFeeSchema>["body"];
export type ListStudentFeesQuery = z.infer<typeof listStudentFeesQuerySchema>["query"];
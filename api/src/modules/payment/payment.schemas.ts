import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const paymentModeSchema = z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "CHEQUE", "DD", "ONLINE", "OTHER"]);
export const paymentStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]);

export const createPaymentSchema = z.object({
  body: z.object({
    studentId: z.uuid(),
    studentFeeId: z.uuid(),
    academicYearId: z.uuid(),
    amount: z.number().positive().max(999999.99),
    paymentDate: z.iso.date(),
    paymentMode: paymentModeSchema,
    transactionRef: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    status: paymentStatusSchema.default("COMPLETED"),
  }),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional().nullable(),
    status: paymentStatusSchema.optional(),
    transactionRef: z.string().max(100).optional().nullable(),
  }),
  params: idParamSchema,
});

export const listPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    studentId: z.uuid().optional(),
    studentFeeId: z.uuid().optional(),
    academicYearId: z.uuid().optional(),
    paymentMode: paymentModeSchema.optional(),
    status: paymentStatusSchema.optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>["body"];
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>["body"];
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>["query"];
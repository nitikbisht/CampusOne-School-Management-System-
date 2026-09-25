import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const listReceiptsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    studentId: z.uuid().optional(),
    academicYearId: z.uuid().optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    search: z.string().max(100).optional(),
  }),
});

export const generateReceiptSchema = z.object({
  params: z.object({ paymentId: z.uuid() }),
});

export type ListReceiptsQuery = z.infer<typeof listReceiptsQuerySchema>["query"];
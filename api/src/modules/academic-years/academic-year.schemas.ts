import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1).max(50), // e.g. "2026-27"
    startDate: z.iso.date(), // YYYY-MM-DD
    endDate: z.iso.date(),
  })
  .refine((v) => v.startDate < v.endDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

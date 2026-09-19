import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createParentSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).max(20),
  alternatePhone: z.string().trim().max(20).optional(),
  occupation: z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(50).optional(),
  state: z.string().trim().max(50).optional(),
  pincode: z.string().trim().max(10).optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;

export const updateParentSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).max(20).optional(),
  alternatePhone: z.string().trim().max(20).optional(),
  occupation: z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(50).optional(),
  state: z.string().trim().max(50).optional(),
  pincode: z.string().trim().max(10).optional(),
  isPrimary: z.boolean().optional(),
});

export type UpdateParentInput = z.infer<typeof updateParentSchema>;

export const listParentsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListParentsQuery = z.infer<typeof listParentsQuerySchema>;

export const linkChildSchema = z.object({
  studentId: z.uuid(),
  relation: z.string().trim().min(1).max(50),
});

export type LinkChildInput = z.infer<typeof linkChildSchema>;
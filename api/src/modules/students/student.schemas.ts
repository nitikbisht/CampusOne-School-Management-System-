import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

export const createStudentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(50),
  firstName: z.string().trim().min(1).max(50),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1).max(50),
  dateOfBirth: z.string().date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.string().trim().max(10).optional(),
  religion: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  nationality: z.string().trim().max(50).optional(),
  motherTongue: z.string().trim().max(50).optional(),
  aadharNumber: z.string().trim().max(12).optional(),
  photoUrl: z.string().url().optional(),
  admissionDate: z.string().date(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(50).optional(),
  firstName: z.string().trim().min(1).max(50).optional(),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodGroup: z.string().trim().max(10).optional(),
  religion: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  nationality: z.string().trim().max(50).optional(),
  motherTongue: z.string().trim().max(50).optional(),
  aadharNumber: z.string().trim().max(12).optional(),
  photoUrl: z.string().url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN", "ON_LEAVE"]).optional(),
  admissionDate: z.string().date().optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const listStudentsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN", "ON_LEAVE"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
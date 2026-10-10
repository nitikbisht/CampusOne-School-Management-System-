import { z } from "zod";

/** Step 1: School profile */
export const schoolProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim(),
    code: z.string().min(2).max(10).toUpperCase().trim(),
    address: z.string().max(500).optional(),
    contactEmail: z.email().toLowerCase().trim(),
    contactPhone: z.string().max(30).optional(),
    timezone: z.string().default("UTC"),
  }),
});

export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>["body"];

/** Step 2: Initial user */
export const initialUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).trim(),
    lastName: z.string().min(1).max(100).trim(),
    email: z.email().toLowerCase().trim(),
    role: z.enum(["Principal", "Admin"]),
    tempPassword: z.string().min(8).max(128).optional(),
    sendInvite: z.boolean().default(true),
  }),
});

export type InitialUserInput = z.infer<typeof initialUserSchema>["body"];

/** Combined onboarding flow */
export const onboardSchoolSchema = z.object({
  body: z.object({
    school: schoolProfileSchema.shape.body,
    initialUser: initialUserSchema.shape.body,
  }),
});

export type OnboardSchoolInput = z.infer<typeof onboardSchoolSchema>["body"];

/** Check uniqueness */
export const checkUniquenessSchema = z.object({
  query: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    email: z.string().optional(),
  }),
});

export type CheckUniquenessQuery = z.infer<typeof checkUniquenessSchema>["query"];
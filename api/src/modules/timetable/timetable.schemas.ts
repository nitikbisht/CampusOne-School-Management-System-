import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });

// Period schemas
export const createPeriodSchema = z.object({
  name: z.string().trim().min(1).max(50), // e.g., "Period 1", "Morning Assembly"
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "startTime must be HH:MM format (24-hour)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "endTime must be HH:MM format (24-hour)"),
  displayOrder: z.int().min(0).default(0),
  isBreak: z.boolean().default(false),
});

export const updatePeriodSchema = createPeriodSchema.partial();

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;

// Room schemas
export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(100), // e.g., "Room 101", "Science Lab"
  code: z.string().trim().min(1).max(20), // Short code e.g., "R101", "SCI-LAB"
  capacity: z.int().positive().optional(),
  type: z.string().max(50).optional(), // CLASSROOM, LAB, LIBRARY, AUDITORIUM, etc.
});

export const updateRoomSchema = createRoomSchema.partial();

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// Timetable schemas
export const createTimetableSchema = z.object({
  academicYearId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  scope: z.enum(["SCHOOL", "CLASS", "TEACHER"]),
  scopeId: z.uuid().optional(), // classId or teacherId when scope is CLASS or TEACHER
});

export const updateTimetableSchema = createTimetableSchema.partial();

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;

// Timetable Entry schemas
export const createTimetableEntrySchema = z.object({
  timetableId: z.uuid(),
  periodId: z.uuid(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  subjectId: z.uuid().optional(),
  teacherId: z.uuid().optional(),
  roomId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  isSubstitution: z.boolean().default(false),
  originalTeacherId: z.uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateTimetableEntrySchema = createTimetableEntrySchema.partial();

export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>;
export type UpdateTimetableEntryInput = z.infer<typeof updateTimetableEntrySchema>;

// Bulk create entries for a timetable
export const bulkCreateEntriesSchema = z.object({
  timetableId: z.uuid(),
  entries: z.array(createTimetableEntrySchema.omit({ timetableId: true })).min(1),
});

export type BulkCreateEntriesInput = z.infer<typeof bulkCreateEntriesSchema>;

// Publish timetable
export const publishTimetableSchema = z.object({
  version: z.int().optional(),
});

export type PublishTimetableInput = z.infer<typeof publishTimetableSchema>;

// Conflict check query
export const conflictCheckQuerySchema = z.object({
  timetableId: z.uuid(),
  teacherId: z.uuid().optional(),
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  roomId: z.uuid().optional(),
  periodId: z.uuid(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  excludeEntryId: z.uuid().optional(),
});

export type ConflictCheckQuery = z.infer<typeof conflictCheckQuerySchema>;
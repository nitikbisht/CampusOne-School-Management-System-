import { prisma } from "../../lib/prisma.js";
import type { DayOfWeek } from "@prisma/client";

/** Data access only: no business rules here. Every query is scoped by schoolId. */

// --- Period Repository ---
export const periodRepository = {
  list(schoolId: string) {
    return prisma.period.findMany({
      where: { schoolId, isActive: true },
      orderBy: { displayOrder: "asc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.period.findFirst({ where: { id, schoolId } });
  },

  create(schoolId: string, data: {
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    isBreak: boolean;
  }) {
    return prisma.period.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: Partial<{
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    isBreak: boolean;
    isActive: boolean;
  }>) {
    return prisma.period.update({
      where: { id, schoolId },
      data,
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.period.delete({ where: { id, schoolId } });
  },
};

// --- Room Repository ---
export const roomRepository = {
  list(schoolId: string) {
    return prisma.room.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.room.findFirst({ where: { id, schoolId } });
  },

  create(schoolId: string, data: {
    name: string;
    code: string;
    capacity?: number;
    type?: string;
  }) {
    return prisma.room.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: Partial<{
    name: string;
    code: string;
    capacity?: number;
    type?: string;
    isActive: boolean;
  }>) {
    return prisma.room.update({
      where: { id, schoolId },
      data,
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.room.delete({ where: { id, schoolId } });
  },
};

// --- Timetable Repository ---
export const timetableRepository = {
  list(schoolId: string, academicYearId?: string) {
    return prisma.timetable.findMany({
      where: {
        schoolId,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        academicYear: { select: { name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.timetable.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: { select: { name: true } },
        entries: {
          include: {
            period: true,
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
            room: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
          orderBy: [{ dayOfWeek: "asc" }, { period: { displayOrder: "asc" } }],
        },
      },
    });
  },

  findByScope(schoolId: string, academicYearId: string, scope: string, scopeId?: string) {
    return prisma.timetable.findFirst({
      where: { schoolId, academicYearId, scope, scopeId },
    });
  },

  create(schoolId: string, data: {
    academicYearId: string;
    name: string;
    scope: string;
    scopeId?: string;
  }) {
    return prisma.timetable.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: Partial<{
    name: string;
    scope: string;
    scopeId?: string;
  }>) {
    return prisma.timetable.update({
      where: { id, schoolId },
      data,
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.timetable.delete({ where: { id, schoolId } });
  },

  /** Publishes a timetable: sets status to PUBLISHED, increments version, sets publishedAt/publishedById */
  async publish(schoolId: string, id: string, publishedById: string) {
    return prisma.$transaction(async (tx) => {
      const timetable = await tx.timetable.findFirst({ where: { id, schoolId } });
      if (!timetable) throw new Error("Timetable not found");
      if (timetable.status === "PUBLISHED") {
        throw new Error("Timetable is already published");
      }

      return tx.timetable.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          version: { increment: 1 },
          publishedAt: new Date(),
          publishedById,
        },
      });
    });
  },

  /** Archives a published timetable */
  async archive(schoolId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const timetable = await tx.timetable.findFirst({ where: { id, schoolId } });
      if (!timetable) throw new Error("Timetable not found");
      if (timetable.status !== "PUBLISHED") {
        throw new Error("Only published timetables can be archived");
      }

      return tx.timetable.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
    });
  },
};

// --- Timetable Entry Repository ---
export const timetableEntryRepository = {
  listByTimetable(schoolId: string, timetableId: string) {
    return prisma.timetableEntry.findMany({
      where: { schoolId, timetableId },
      include: {
        period: true,
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: { displayOrder: "asc" } }],
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.timetableEntry.findFirst({
      where: { id, schoolId },
      include: {
        period: true,
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  },

  findByPeriodDay(schoolId: string, timetableId: string, periodId: string, dayOfWeek: DayOfWeek) {
    return prisma.timetableEntry.findFirst({
      where: { schoolId, timetableId, periodId, dayOfWeek },
    });
  },

  create(schoolId: string, data: {
    timetableId: string;
    academicYearId: string;
    periodId: string;
    dayOfWeek: DayOfWeek;
    subjectId?: string;
    teacherId?: string;
    roomId?: string;
    classId?: string;
    sectionId?: string;
    isSubstitution?: boolean;
    originalTeacherId?: string;
    notes?: string;
  }) {
    return prisma.timetableEntry.create({ data: { schoolId, ...data } });
  },

  async createMany(schoolId: string, entries: Array<{
    timetableId: string;
    academicYearId: string;
    periodId: string;
    dayOfWeek: DayOfWeek;
    subjectId?: string;
    teacherId?: string;
    roomId?: string;
    classId?: string;
    sectionId?: string;
    isSubstitution?: boolean;
    originalTeacherId?: string;
    notes?: string;
  }>) {
    return prisma.$transaction(
      entries.map((entry) =>
        prisma.timetableEntry.create({ data: { schoolId, ...entry } })
      )
    );
  },

  update(schoolId: string, id: string, data: Partial<{
    periodId: string;
    dayOfWeek: DayOfWeek;
    subjectId: string;
    teacherId: string;
    roomId: string;
    classId?: string;
    sectionId?: string;
    isSubstitution: boolean;
    originalTeacherId: string;
    notes: string;
  }>) {
    return prisma.timetableEntry.update({
      where: { id, schoolId },
      data,
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.timetableEntry.delete({ where: { id, schoolId } });
  },

  deleteByTimetable(schoolId: string, timetableId: string) {
    return prisma.timetableEntry.deleteMany({ where: { schoolId, timetableId } });
  },

  /** Check for conflicts: teacher, class/section, or room double-booked */
  async checkConflicts(schoolId: string, params: {
    timetableId: string;
    periodId: string;
    dayOfWeek: string;
    teacherId?: string;
    classId?: string;
    sectionId?: string;
    roomId?: string;
    excludeEntryId?: string;
  }) {
    const conflicts: string[] = [];

    const where: any = {
      schoolId,
      periodId: params.periodId,
      dayOfWeek: params.dayOfWeek,
      timetableId: { not: params.timetableId }, // Check across OTHER timetables in same school
    };

    if (params.excludeEntryId) {
      where.id = { not: params.excludeEntryId };
    }

    // Check teacher conflict
    if (params.teacherId) {
      const teacherConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...where,
          teacherId: params.teacherId,
        },
        include: {
          timetable: { select: { name: true, scope: true } },
          period: { select: { name: true } },
        },
      });
      if (teacherConflict) {
        conflicts.push(`Teacher conflict: ${teacherConflict.timetable.name} (${teacherConflict.timetable.scope}) at ${teacherConflict.period.name} on ${params.dayOfWeek}`);
      }
    }

    // Check class/section conflict
    if (params.classId && params.sectionId) {
      const classConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...where,
          classId: params.classId,
          sectionId: params.sectionId,
        },
        include: {
          timetable: { select: { name: true, scope: true } },
          period: { select: { name: true } },
        },
      });
      if (classConflict) {
        conflicts.push(`Class/Section conflict: ${classConflict.timetable.name} (${classConflict.timetable.scope}) at ${classConflict.period.name} on ${params.dayOfWeek}`);
      }
    }

    // Check room conflict
    if (params.roomId) {
      const roomConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...where,
          roomId: params.roomId,
        },
        include: {
          timetable: { select: { name: true, scope: true } },
          period: { select: { name: true } },
        },
      });
      if (roomConflict) {
        conflicts.push(`Room conflict: ${roomConflict.timetable.name} (${roomConflict.timetable.scope}) at ${roomConflict.period.name} on ${params.dayOfWeek}`);
      }
    }

    return conflicts;
  },

  /** Get teacher's timetable entries for a specific academic year */
  getTeacherTimetable(schoolId: string, teacherId: string, academicYearId: string) {
    return prisma.timetableEntry.findMany({
      where: {
        schoolId,
        teacherId,
        academicYearId,
        timetable: { status: "PUBLISHED" },
      },
      include: {
        period: true,
        subject: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        timetable: { select: { id: true, name: true, scope: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: { displayOrder: "asc" } }],
    });
  },

  /** Get class/section timetable entries for a specific academic year */
  getClassTimetable(schoolId: string, classId: string, sectionId: string, academicYearId: string) {
    return prisma.timetableEntry.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        academicYearId,
        timetable: { status: "PUBLISHED" },
      },
      include: {
        period: true,
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        timetable: { select: { id: true, name: true, scope: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: { displayOrder: "asc" } }],
    });
  },
};

export type PeriodRepository = typeof periodRepository;
export type RoomRepository = typeof roomRepository;
export type TimetableRepository = typeof timetableRepository;
export type TimetableEntryRepository = typeof timetableEntryRepository;
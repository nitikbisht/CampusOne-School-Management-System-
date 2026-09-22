import { prisma } from "../../lib/prisma.js";

/** Data access only: no business rules here. Every query is scoped by schoolId. */

export const assignmentRepository = {
  list(schoolId: string, filters?: {
    academicYearId?: string;
    teacherId?: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
  }) {
    return prisma.teacherAssignment.findMany({
      where: {
        schoolId,
        ...(filters?.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters?.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters?.classId ? { classId: filters.classId } : {}),
        ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
        ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ academicYear: { startDate: "desc" } }, { class: { displayOrder: "asc" } }, { section: { name: "asc" } }],
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.teacherAssignment.findFirst({
      where: { id, schoolId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  },

  create(schoolId: string, data: {
    teacherId: string;
    academicYearId: string;
    subjectId: string;
    classId: string;
    sectionId: string;
    isPrimary?: boolean;
  }) {
    return prisma.teacherAssignment.create({
      data: { schoolId, ...data },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  },

  update(schoolId: string, id: string, data: Partial<{
    subjectId: string;
    classId: string;
    sectionId: string;
    isPrimary: boolean;
  }>) {
    return prisma.teacherAssignment.update({
      where: { id, schoolId },
      data,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.teacherAssignment.delete({ where: { id, schoolId } });
  },

  /** Get assignments for a teacher in an academic year */
  getByTeacherYear(schoolId: string, teacherId: string, academicYearId: string) {
    return prisma.teacherAssignment.findMany({
      where: { schoolId, teacherId, academicYearId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { displayOrder: "asc" } }, { section: { name: "asc" } }],
    });
  },

  /** Get assignments for a class/section in an academic year */
  getByClassSectionYear(schoolId: string, classId: string, sectionId: string, academicYearId: string) {
    return prisma.teacherAssignment.findMany({
      where: { schoolId, classId, sectionId, academicYearId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });
  },

  /** Check if there's already a primary teacher for this class/section/subject */
  async checkPrimaryConflict(schoolId: string, academicYearId: string, subjectId: string, classId: string, sectionId: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        schoolId,
        academicYearId,
        subjectId,
        classId,
        sectionId,
        isPrimary: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  },
};

export type AssignmentRepository = typeof assignmentRepository;
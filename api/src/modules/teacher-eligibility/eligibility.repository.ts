import { prisma } from "../../lib/prisma.js";

/** Data access only: no business rules here. Every query is scoped by schoolId. */

export const eligibilityRepository = {
  list(schoolId: string, filters?: {
    teacherId?: string;
    subjectId?: string;
    classId?: string;
    isActive?: boolean;
  }) {
    return prisma.teacherEligibility.findMany({
      where: {
        schoolId,
        ...(filters?.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters?.classId ? { classId: filters.classId } : {}),
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        maxClass: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.teacherEligibility.findFirst({
      where: { id, schoolId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        maxClass: { select: { id: true, name: true } },
      },
    });
  },

  create(schoolId: string, data: {
    teacherId: string;
    subjectId: string;
    classId: string;
    maxClassId?: string;
  }) {
    return prisma.teacherEligibility.create({
      data: { schoolId, ...data },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        maxClass: { select: { id: true, name: true } },
      },
    });
  },

  update(schoolId: string, id: string, data: Partial<{
    subjectId: string;
    classId: string;
    maxClassId: string | null;
    isActive: boolean;
  }>) {
    return prisma.teacherEligibility.update({
      where: { id, schoolId },
      data,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        maxClass: { select: { id: true, name: true } },
      },
    });
  },

  delete(schoolId: string, id: string) {
    return prisma.teacherEligibility.delete({ where: { id, schoolId } });
  },

  /** Check if a teacher is eligible to teach a subject for a specific class */
  async checkEligibility(schoolId: string, teacherId: string, subjectId: string, classId: string): Promise<boolean> {
    const eligibility = await prisma.teacherEligibility.findFirst({
      where: {
        schoolId,
        teacherId,
        subjectId,
        isActive: true,
        classId: { lte: classId }, // classId <= target class (since classId is min class)
        // Check if maxClassId is null (single class) or >= target class
        OR: [
          { maxClassId: null },
          { maxClassId: { gte: classId } },
        ],
      },
    });
    return !!eligibility;
  },

  /** Get all eligibilities for a teacher */
  getByTeacher(schoolId: string, teacherId: string) {
    return prisma.teacherEligibility.findMany({
      where: { schoolId, teacherId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        maxClass: { select: { id: true, name: true } },
      },
      orderBy: [{ subject: { name: "asc" } }, { class: { displayOrder: "asc" } }],
    });
  },
};

export type EligibilityRepository = typeof eligibilityRepository;
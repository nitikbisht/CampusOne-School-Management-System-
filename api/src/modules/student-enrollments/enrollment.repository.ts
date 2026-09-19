import { prisma } from "../../lib/prisma.js";

export interface NewEnrollment {
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  rollNumber?: number;
  isActive: boolean;
}

export interface UpdateEnrollment {
  classId?: string;
  sectionId?: string;
  rollNumber?: number;
  isActive?: boolean;
}

export interface EnrollmentListOptions {
  schoolId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const enrollmentRepository = {
  async list(options: EnrollmentListOptions) {
    const { schoolId, academicYearId, classId, sectionId, studentId, isActive, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (studentId) where.studentId = studentId;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      prisma.studentEnrollment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } },
          academicYear: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      }),
      prisma.studentEnrollment.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById(schoolId: string, id: string) {
    return prisma.studentEnrollment.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  },

  findByStudentAndYear(schoolId: string, studentId: string, academicYearId: string) {
    return prisma.studentEnrollment.findFirst({
      where: { studentId, academicYearId, schoolId },
    });
  },

  findByClassSectionRoll(schoolId: string, academicYearId: string, classId: string, sectionId: string, rollNumber: number) {
    return prisma.studentEnrollment.findFirst({
      where: { academicYearId, classId, sectionId, rollNumber, schoolId },
    });
  },

  create(schoolId: string, data: NewEnrollment) {
    return prisma.studentEnrollment.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateEnrollment) {
    return prisma.studentEnrollment.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.studentEnrollment.delete({ where: { id } });
  },
};

export type EnrollmentRepository = typeof enrollmentRepository;
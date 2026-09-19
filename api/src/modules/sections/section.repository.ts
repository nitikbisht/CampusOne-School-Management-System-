import { prisma } from "../../lib/prisma.js";

export interface NewSection {
  academicYearId: string;
  classId: string;
  name: string;
  capacity?: number;
}

export interface UpdateSection {
  name?: string;
  capacity?: number | null;
  isActive?: boolean;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const sectionRepository = {
  list(schoolId: string) {
    return prisma.section.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: {
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  },

  listByAcademicYear(schoolId: string, academicYearId: string) {
    return prisma.section.findMany({
      where: { schoolId, academicYearId },
      orderBy: { name: "asc" },
      include: {
        class: { select: { id: true, name: true } },
      },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.section.findFirst({
      where: { id, schoolId },
      include: {
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  },

  create(schoolId: string, data: NewSection) {
    return prisma.section.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateSection) {
    return prisma.section.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.section.delete({ where: { id } });
  },
};

export type SectionRepository = typeof sectionRepository;
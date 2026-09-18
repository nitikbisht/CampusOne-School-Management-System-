import { prisma } from "../../lib/prisma.js";

export interface NewAcademicYear {
  name: string;
  startDate: Date;
  endDate: Date;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const academicYearRepository = {
  list(schoolId: string) {
    return prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.academicYear.findFirst({ where: { id, schoolId } });
  },

  create(schoolId: string, data: NewAcademicYear) {
    return prisma.academicYear.create({ data: { schoolId, ...data } });
  },

  /** Makes one year current and clears the flag on every other year, atomically. */
  setCurrent(schoolId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
      return tx.academicYear.update({
        where: { id },
        data: { isCurrent: true, status: "ACTIVE" },
      });
    });
  },
};

export type AcademicYearRepository = typeof academicYearRepository;

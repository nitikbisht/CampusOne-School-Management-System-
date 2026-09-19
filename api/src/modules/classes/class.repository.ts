import { prisma } from "../../lib/prisma.js";

export interface NewClass {
  name: string;
  displayOrder: number;
}

export interface UpdateClass {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const classRepository = {
  list(schoolId: string) {
    return prisma.schoolClass.findMany({
      where: { schoolId },
      orderBy: { displayOrder: "asc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.schoolClass.findFirst({ where: { id, schoolId } });
  },

  create(schoolId: string, data: NewClass) {
    return prisma.schoolClass.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateClass) {
    return prisma.schoolClass.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.schoolClass.delete({ where: { id } });
  },
};

export type ClassRepository = typeof classRepository;
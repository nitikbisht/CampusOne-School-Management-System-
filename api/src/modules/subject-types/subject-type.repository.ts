import { prisma } from "../../lib/prisma.js";

export interface NewSubjectType {
  name: string;
}

export interface UpdateSubjectType {
  name?: string;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const subjectTypeRepository = {
  list(schoolId: string) {
    return prisma.subjectType.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.subjectType.findFirst({ where: { id, schoolId } });
  },

  create(schoolId: string, data: NewSubjectType) {
    return prisma.subjectType.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateSubjectType) {
    return prisma.subjectType.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.subjectType.delete({ where: { id } });
  },
};

export type SubjectTypeRepository = typeof subjectTypeRepository;
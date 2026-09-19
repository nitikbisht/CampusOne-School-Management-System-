import { prisma } from "../../lib/prisma.js";

export interface NewSubject {
  subjectTypeId: string;
  name: string;
  code: string;
}

export interface UpdateSubject {
  subjectTypeId?: string;
  name?: string;
  code?: string;
  isActive?: boolean;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const subjectRepository = {
  list(schoolId: string) {
    return prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: {
        subjectType: { select: { id: true, name: true } },
      },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.subject.findFirst({
      where: { id, schoolId },
      include: {
        subjectType: { select: { id: true, name: true } },
      },
    });
  },

  create(schoolId: string, data: NewSubject) {
    return prisma.subject.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateSubject) {
    return prisma.subject.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.subject.delete({ where: { id } });
  },
};

export type SubjectRepository = typeof subjectRepository;
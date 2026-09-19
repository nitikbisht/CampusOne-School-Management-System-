import { prisma } from "../../lib/prisma.js";

export interface NewClassSubject {
  classId: string;
  subjectId: string;
}

export interface UpdateClassSubject {
  classId?: string;
  subjectId?: string;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const classSubjectRepository = {
  list(schoolId: string) {
    return prisma.classSubject.findMany({
      where: { schoolId },
      orderBy: { class: { displayOrder: "asc" } },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true, subjectType: { select: { id: true, name: true } } } },
      },
    });
  },

  listByClass(schoolId: string, classId: string) {
    return prisma.classSubject.findMany({
      where: { schoolId, classId },
      orderBy: { subject: { name: "asc" } },
      include: {
        subject: { select: { id: true, name: true, code: true, subjectType: { select: { id: true, name: true } } } },
      },
    });
  },

  findById(schoolId: string, id: string) {
    return prisma.classSubject.findFirst({
      where: { id, schoolId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true, subjectType: { select: { id: true, name: true } } } },
      },
    });
  },

  create(schoolId: string, data: NewClassSubject) {
    return prisma.classSubject.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateClassSubject) {
    return prisma.classSubject.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.classSubject.delete({ where: { id } });
  },
};

export type ClassSubjectRepository = typeof classSubjectRepository;
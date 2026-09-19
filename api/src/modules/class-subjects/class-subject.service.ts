import { AppError } from "../../lib/errors.js";
import type { CreateClassSubjectInput, UpdateClassSubjectInput } from "./class-subject.schemas.js";
import { classSubjectRepository, type ClassSubjectRepository } from "./class-subject.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createClassSubjectService(repo: ClassSubjectRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    listByClass(schoolId: string, classId: string) {
      return repo.listByClass(schoolId, classId);
    },

    async get(schoolId: string, id: string) {
      const classSubject = await repo.findById(schoolId, id);
      if (!classSubject) throw AppError.notFound("Class-Subject mapping not found");
      return classSubject;
    },

    async create(schoolId: string, input: CreateClassSubjectInput) {
      // Validate class exists and belongs to school
      const cls = await prisma.schoolClass.findFirst({
        where: { id: input.classId, schoolId },
      });
      if (!cls) throw AppError.notFound("Class not found");

      // Validate subject exists and belongs to school
      const subject = await prisma.subject.findFirst({
        where: { id: input.subjectId, schoolId },
      });
      if (!subject) throw AppError.notFound("Subject not found");

      return repo.create(schoolId, {
        classId: input.classId,
        subjectId: input.subjectId,
      });
    },

    async update(schoolId: string, id: string, input: UpdateClassSubjectInput) {
      const classSubject = await repo.findById(schoolId, id);
      if (!classSubject) throw AppError.notFound("Class-Subject mapping not found");

      // If updating classId, validate it
      if (input.classId) {
        const cls = await prisma.schoolClass.findFirst({
          where: { id: input.classId, schoolId },
        });
        if (!cls) throw AppError.notFound("Class not found");
      }

      // If updating subjectId, validate it
      if (input.subjectId) {
        const subject = await prisma.subject.findFirst({
          where: { id: input.subjectId, schoolId },
        });
        if (!subject) throw AppError.notFound("Subject not found");
      }

      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const classSubject = await repo.findById(schoolId, id);
      if (!classSubject) throw AppError.notFound("Class-Subject mapping not found");
      return repo.delete(schoolId, id);
    },
  };
}

export const classSubjectService = createClassSubjectService(classSubjectRepository);
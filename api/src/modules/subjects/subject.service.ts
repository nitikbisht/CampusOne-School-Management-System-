import { AppError } from "../../lib/errors.js";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.schemas.js";
import { subjectRepository, type SubjectRepository } from "./subject.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createSubjectService(repo: SubjectRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    async get(schoolId: string, id: string) {
      const subject = await repo.findById(schoolId, id);
      if (!subject) throw AppError.notFound("Subject not found");
      return subject;
    },

    async create(schoolId: string, input: CreateSubjectInput) {
      // Validate subject type exists and belongs to school
      const subjectType = await prisma.subjectType.findFirst({
        where: { id: input.subjectTypeId, schoolId },
      });
      if (!subjectType) throw AppError.notFound("Subject type not found");

      return repo.create(schoolId, {
        subjectTypeId: input.subjectTypeId,
        name: input.name,
        code: input.code.toUpperCase(),
      });
    },

    async update(schoolId: string, id: string, input: UpdateSubjectInput) {
      const subject = await repo.findById(schoolId, id);
      if (!subject) throw AppError.notFound("Subject not found");

      // If updating subjectTypeId, validate it
      if (input.subjectTypeId) {
        const subjectType = await prisma.subjectType.findFirst({
          where: { id: input.subjectTypeId, schoolId },
        });
        if (!subjectType) throw AppError.notFound("Subject type not found");
      }

      const updateData = { ...input };
      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
      }

      return repo.update(schoolId, id, updateData);
    },

    async delete(schoolId: string, id: string) {
      const subject = await repo.findById(schoolId, id);
      if (!subject) throw AppError.notFound("Subject not found");
      // Check if subject has class subjects
      const hasClassSubjects = await prisma.classSubject.count({ where: { subjectId: id } });
      if (hasClassSubjects > 0) {
        throw AppError.conflict("Cannot delete subject with associated class mappings");
      }
      return repo.delete(schoolId, id);
    },
  };
}

export const subjectService = createSubjectService(subjectRepository);
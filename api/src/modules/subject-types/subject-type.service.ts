import { AppError } from "../../lib/errors.js";
import type { CreateSubjectTypeInput, UpdateSubjectTypeInput } from "./subject-type.schemas.js";
import { subjectTypeRepository, type SubjectTypeRepository } from "./subject-type.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createSubjectTypeService(repo: SubjectTypeRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    async get(schoolId: string, id: string) {
      const subjectType = await repo.findById(schoolId, id);
      if (!subjectType) throw AppError.notFound("Subject type not found");
      return subjectType;
    },

    create(schoolId: string, input: CreateSubjectTypeInput) {
      return repo.create(schoolId, { name: input.name });
    },

    async update(schoolId: string, id: string, input: UpdateSubjectTypeInput) {
      const subjectType = await repo.findById(schoolId, id);
      if (!subjectType) throw AppError.notFound("Subject type not found");
      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const subjectType = await repo.findById(schoolId, id);
      if (!subjectType) throw AppError.notFound("Subject type not found");
      // Check if subject type has subjects
      const hasSubjects = await prisma.subject.count({ where: { subjectTypeId: id } });
      if (hasSubjects > 0) {
        throw AppError.conflict("Cannot delete subject type with associated subjects");
      }
      return repo.delete(schoolId, id);
    },
  };
}

export const subjectTypeService = createSubjectTypeService(subjectTypeRepository);
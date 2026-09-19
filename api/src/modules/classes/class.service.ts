import { AppError } from "../../lib/errors.js";
import type { CreateClassInput, UpdateClassInput } from "./class.schemas.js";
import { classRepository, type ClassRepository } from "./class.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createClassService(repo: ClassRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    async get(schoolId: string, id: string) {
      const cls = await repo.findById(schoolId, id);
      if (!cls) throw AppError.notFound("Class not found");
      return cls;
    },

    create(schoolId: string, input: CreateClassInput) {
      return repo.create(schoolId, {
        name: input.name,
        displayOrder: input.displayOrder,
      });
    },

    async update(schoolId: string, id: string, input: UpdateClassInput) {
      const cls = await repo.findById(schoolId, id);
      if (!cls) throw AppError.notFound("Class not found");
      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const cls = await repo.findById(schoolId, id);
      if (!cls) throw AppError.notFound("Class not found");
      // Check if class has sections or subjects
      const hasSections = await prisma.section.count({ where: { classId: id } });
      const hasSubjects = await prisma.classSubject.count({ where: { classId: id } });
      if (hasSections > 0 || hasSubjects > 0) {
        throw AppError.conflict("Cannot delete class with associated sections or subjects");
      }
      return repo.delete(schoolId, id);
    },
  };
}

export const classService = createClassService(classRepository);
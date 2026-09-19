import { AppError } from "../../lib/errors.js";
import type { CreateSectionInput, UpdateSectionInput } from "./section.schemas.js";
import { sectionRepository, type SectionRepository } from "./section.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createSectionService(repo: SectionRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    listByAcademicYear(schoolId: string, academicYearId: string) {
      return repo.listByAcademicYear(schoolId, academicYearId);
    },

    async get(schoolId: string, id: string) {
      const section = await repo.findById(schoolId, id);
      if (!section) throw AppError.notFound("Section not found");
      return section;
    },

    async create(schoolId: string, input: CreateSectionInput) {
      // Validate academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId },
      });
      if (!academicYear) throw AppError.notFound("Academic year not found");

      // Validate class exists and belongs to school
      const cls = await prisma.schoolClass.findFirst({
        where: { id: input.classId, schoolId },
      });
      if (!cls) throw AppError.notFound("Class not found");

      return repo.create(schoolId, {
        academicYearId: input.academicYearId,
        classId: input.classId,
        name: input.name,
        capacity: input.capacity,
      });
    },

    async update(schoolId: string, id: string, input: UpdateSectionInput) {
      const section = await repo.findById(schoolId, id);
      if (!section) throw AppError.notFound("Section not found");
      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const section = await repo.findById(schoolId, id);
      if (!section) throw AppError.notFound("Section not found");
      return repo.delete(schoolId, id);
    },
  };
}

export const sectionService = createSectionService(sectionRepository);
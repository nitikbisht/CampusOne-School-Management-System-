import { AppError } from "../../lib/errors.js";
import type { CreateAcademicYearInput } from "./academic-year.schemas.js";
import {
  academicYearRepository,
  type AcademicYearRepository,
} from "./academic-year.repository.js";

const toUtcDate = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createAcademicYearService(repo: AcademicYearRepository) {
  return {
    list(schoolId: string) {
      return repo.list(schoolId);
    },

    async get(schoolId: string, id: string) {
      const year = await repo.findById(schoolId, id);
      if (!year) throw AppError.notFound("Academic year not found");
      return year;
    },

    create(schoolId: string, input: CreateAcademicYearInput) {
      return repo.create(schoolId, {
        name: input.name,
        startDate: toUtcDate(input.startDate),
        endDate: toUtcDate(input.endDate),
      });
    },

    async activate(schoolId: string, id: string) {
      const year = await repo.findById(schoolId, id);
      if (!year) throw AppError.notFound("Academic year not found");
      if (year.status === "CLOSED") {
        throw AppError.conflict("A closed academic year cannot be activated");
      }
      return repo.setCurrent(schoolId, id);
    },
  };
}

export const academicYearService = createAcademicYearService(academicYearRepository);

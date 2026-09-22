import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { feeRepository } from "./fee.repository.js";
import type { CreateFeeInput, UpdateFeeInput, ListFeesQuery } from "./fee.schemas.js";

const feeService = (() => {
  const repo = feeRepository;

  return {
    async createFee(schoolId: string, input: CreateFeeInput) {
      // Check if academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
      if (!academicYear || academicYear.schoolId !== schoolId) {
        throw AppError.notFound("Academic year not found");
      }

      // Check if class exists and belongs to school (if provided)
      if (input.classId) {
        const classEntity = await prisma.schoolClass.findUnique({ where: { id: input.classId } });
        if (!classEntity || classEntity.schoolId !== schoolId) {
          throw AppError.notFound("Class not found");
        }
      }

      // Check for duplicate fee name within the same academic year and class
      const existing = await prisma.fee.findFirst({
        where: {
          schoolId,
          name: input.name,
          academicYearId: input.academicYearId,
          classId: input.classId ?? null,
        },
      });
      if (existing) {
        throw AppError.conflict("A fee with this name already exists for the selected academic year and class");
      }

      return repo.create({
        school: { connect: { id: schoolId } },
        name: input.name,
        description: input.description,
        amount: input.amount,
        frequency: input.frequency,
        academicYear: { connect: { id: input.academicYearId } },
        class: input.classId ? { connect: { id: input.classId } } : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isActive: input.isActive,
      });
    },

    async getFee(schoolId: string, id: string) {
      const fee = await repo.findById(id);
      if (!fee || fee.schoolId !== schoolId) {
        throw AppError.notFound("Fee not found");
      }
      return fee;
    },

    async listFees(schoolId: string, query: ListFeesQuery) {
      return repo.findMany(schoolId, query);
    },

    async updateFee(schoolId: string, id: string, input: UpdateFeeInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Fee not found");
      }

      // Check if academic year exists (if changing)
      if (input.academicYearId) {
        const academicYear = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
        if (!academicYear || academicYear.schoolId !== schoolId) {
          throw AppError.notFound("Academic year not found");
        }
      }

      // Check if class exists (if changing)
      if (input.classId !== undefined) {
        if (input.classId) {
          const classEntity = await prisma.schoolClass.findUnique({ where: { id: input.classId } });
          if (!classEntity || classEntity.schoolId !== schoolId) {
            throw AppError.notFound("Class not found");
          }
        }
      }

      // Check for duplicate name (if changing)
      if (input.name || input.academicYearId || input.classId !== undefined) {
        const name = input.name ?? existing.name;
        const academicYearId = input.academicYearId ?? existing.academicYearId;
        const classId = input.classId ?? existing.classId ?? null;
        const duplicate = await prisma.fee.findFirst({
          where: {
            schoolId,
            name,
            academicYearId,
            classId: classId ?? null,
            id: { not: id },
          },
        });
        if (duplicate) {
          throw AppError.conflict("A fee with this name already exists for the selected academic year and class");
        }
      }

      return repo.update(id, {
        name: input.name,
        description: input.description,
        amount: input.amount,
        frequency: input.frequency,
        academicYear: input.academicYearId ? { connect: { id: input.academicYearId } } : undefined,
        class: input.classId === null ? { disconnect: true } : (input.classId ? { connect: { id: input.classId } } : undefined),
        dueDate: input.dueDate ? new Date(input.dueDate) : (input.dueDate === null ? null : undefined),
        isActive: input.isActive,
      });
    },

    async deleteFee(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Fee not found");
      }
      return repo.delete(id);
    },
  };
})();

export { feeService };
export type FeeService = typeof feeService;
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { feeTypeRepository } from "./fee-type.repository.js";
import type { CreateFeeTypeInput, UpdateFeeTypeInput, ListFeeTypesQuery } from "./fee-type.schemas.js";

const feeTypeService = (() => {
  const repo = feeTypeRepository;

  return {
    async createFeeType(schoolId: string, input: CreateFeeTypeInput) {
      // Check for duplicate name
      const existing = await repo.findByName(schoolId, input.name);
      if (existing) {
        throw AppError.conflict("A fee type with this name already exists");
      }

      return repo.create({
        school: { connect: { id: schoolId } },
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      });
    },

    async getFeeType(schoolId: string, id: string) {
      const feeType = await repo.findById(id);
      if (!feeType || feeType.schoolId !== schoolId) {
        throw AppError.notFound("Fee type not found");
      }
      return feeType;
    },

    async listFeeTypes(schoolId: string, query: ListFeeTypesQuery) {
      return repo.findMany(schoolId, query);
    },

    async updateFeeType(schoolId: string, id: string, input: UpdateFeeTypeInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Fee type not found");
      }

      // Check for duplicate name (if changing)
      if (input.name && input.name !== existing.name) {
        const duplicate = await repo.findByName(schoolId, input.name, id);
        if (duplicate) {
          throw AppError.conflict("A fee type with this name already exists");
        }
      }

      return repo.update(id, {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      });
    },

    async deleteFeeType(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Fee type not found");
      }

      // Check if fee type is in use by any fee structures
      const feesCount = await prisma.fee.count({ where: { feeTypeId: id } });
      if (feesCount > 0) {
        throw AppError.conflict("Cannot delete fee type that is in use by fee structures");
      }

      return repo.delete(id);
    },
  };
})();

export { feeTypeService };
export type FeeTypeService = typeof feeTypeService;
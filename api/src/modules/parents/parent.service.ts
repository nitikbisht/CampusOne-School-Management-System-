import { AppError } from "../../lib/errors.js";
import type { CreateParentInput, UpdateParentInput, LinkChildInput } from "./parent.schemas.js";
import { parentRepository, type ParentRepository } from "./parent.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createParentService(repo: ParentRepository) {
  return {
    async list(schoolId: string, options: { search?: string; page: number; limit: number }) {
      return repo.list({ schoolId, ...options });
    },

    async get(schoolId: string, id: string) {
      const parent = await repo.findById(schoolId, id);
      if (!parent) throw AppError.notFound("Parent not found");
      return parent;
    },

    async create(schoolId: string, input: CreateParentInput) {
      // Check for duplicate email if provided
      if (input.email) {
        const existing = await repo.findByEmail(schoolId, input.email);
        if (existing) {
          throw AppError.conflict("Parent with this email already exists");
        }
      }
      return repo.create(schoolId, {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        occupation: input.occupation,
        qualification: input.qualification,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isPrimary: input.isPrimary ?? false,
      });
    },

    async update(schoolId: string, id: string, input: UpdateParentInput) {
      const parent = await repo.findById(schoolId, id);
      if (!parent) throw AppError.notFound("Parent not found");

      // Check for duplicate email if being updated
      if (input.email && input.email !== parent.email) {
        const existing = await repo.findByEmail(schoolId, input.email);
        if (existing) {
          throw AppError.conflict("Parent with this email already exists");
        }
      }

      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const parent = await repo.findById(schoolId, id);
      if (!parent) throw AppError.notFound("Parent not found");

      // Check if parent has linked students
      const linkedStudents = await prisma.parentStudent.count({ where: { parentId: id } });
      if (linkedStudents > 0) {
        throw AppError.conflict("Cannot delete parent with linked students. Unlink students first.");
      }

      return repo.delete(schoolId, id);
    },

    async linkChild(schoolId: string, parentId: string, input: LinkChildInput) {
      const parent = await repo.findById(schoolId, parentId);
      if (!parent) throw AppError.notFound("Parent not found");

      // Verify student exists
      const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) throw AppError.notFound("Student not found");

      // Check if already linked
      const existing = await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId, studentId: input.studentId } },
      });
      if (existing) {
        throw AppError.conflict("Student is already linked to this parent");
      }

      return repo.linkChild(schoolId, { parentId, studentId: input.studentId, relation: input.relation });
    },

    async unlinkChild(schoolId: string, parentId: string, studentId: string) {
      const parent = await repo.findById(schoolId, parentId);
      if (!parent) throw AppError.notFound("Parent not found");

      const existing = await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId, studentId } },
      });
      if (!existing) {
        throw AppError.notFound("Link not found");
      }

      return repo.unlinkChild(schoolId, parentId, studentId);
    },

    async getChildren(schoolId: string, parentId: string) {
      const parent = await repo.findById(schoolId, parentId);
      if (!parent) throw AppError.notFound("Parent not found");
      return repo.getChildren(schoolId, parentId);
    },

    async getParents(schoolId: string, studentId: string) {
      const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
      if (!student) throw AppError.notFound("Student not found");
      return repo.getParents(schoolId, studentId);
    },
  };
}

export const parentService = createParentService(parentRepository);
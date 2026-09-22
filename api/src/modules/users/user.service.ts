import { AppError } from "../../lib/errors.js";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { userRepository } from "./user.repository.js";
import type { CreateUserInput, UpdateUserInput, ListUsersQuery, ChangePasswordInput } from "./user.schemas.js";

const userService = (() => {
  const repo = userRepository;

  return {
    async createUser(schoolId: string, input: CreateUserInput) {
      // Check for duplicate email
      const existing = await repo.findByEmail(schoolId, input.email);
      if (existing) {
        throw AppError.conflict("A user with this email already exists");
      }

      // Validate roles exist and belong to school
      if (input.roleIds.length > 0) {
        const roles = await prisma.role.findMany({
          where: { id: { in: input.roleIds }, schoolId },
        });
        if (roles.length !== input.roleIds.length) {
          throw AppError.badRequest("One or more roles not found or do not belong to this school");
        }
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      return repo.create({
        school: { connect: { id: schoolId } },
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        isActive: input.isActive,
        roles: {
          create: input.roleIds.map((roleId) => ({ role: { connect: { id: roleId } } })),
        },
      });
    },

    async getUser(schoolId: string, id: string) {
      const user = await repo.findById(id);
      if (!user || user.schoolId !== schoolId) {
        throw AppError.notFound("User not found");
      }
      return user;
    },

    async listUsers(schoolId: string, query: ListUsersQuery) {
      return repo.findMany(schoolId, query);
    },

    async updateUser(schoolId: string, id: string, input: UpdateUserInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("User not found");
      }

      // Check for duplicate email (if changing)
      if (input.email && input.email !== existing.email) {
        const duplicate = await repo.findByEmail(schoolId, input.email);
        if (duplicate) {
          throw AppError.conflict("A user with this email already exists");
        }
      }

      // Validate roles if provided
      if (input.roleIds) {
        const roles = await prisma.role.findMany({
          where: { id: { in: input.roleIds }, schoolId },
        });
        if (roles.length !== input.roleIds.length) {
          throw AppError.badRequest("One or more roles not found or do not belong to this school");
        }
      }

      // Update user basic info
      const updated = await repo.update(id, {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        isActive: input.isActive,
      });

      // Sync roles if provided
      if (input.roleIds) {
        return repo.syncRoles(id, input.roleIds);
      }

      return updated;
    },

    async deleteUser(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("User not found");
      }
      return repo.delete(id);
    },

    async changePassword(schoolId: string, id: string, input: ChangePasswordInput) {
      const user = await repo.findById(id);
      if (!user || user.schoolId !== schoolId) {
        throw AppError.notFound("User not found");
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw AppError.unauthorized("Current password is incorrect");
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
      await repo.updatePassword(id, newPasswordHash);

      return { message: "Password changed successfully" };
    },
  };
})();

export { userService };
export type UserService = typeof userService;
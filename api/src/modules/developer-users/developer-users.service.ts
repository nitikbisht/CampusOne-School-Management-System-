import crypto from "crypto";
import { AppError } from "../../lib/errors.js";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { developerUsersRepository } from "./developer-users.repository.js";
import { auditService } from "../../lib/audit.js";
import type { Request } from "express";
import type { CreateDeveloperUserInput, UpdateDeveloperUserInput, ListDeveloperUsersQuery, ResetPasswordInput, BulkActionInput } from "./developer-users.schemas.js";

/** Generate a secure temporary password */
function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/** Hash password using bcrypt (matching existing auth pattern) */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export const developerUsersService = {
  /**
   * List users across all schools (developer view)
   */
  async listUsers(query: ListDeveloperUsersQuery) {
    return developerUsersRepository.findMany(query);
  },

  /**
   * Get single user with school and roles
   */
  async getUser(id: string) {
    const user = await developerUsersRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  },

  /**
   * Create a user in any school
   */
  async createUser(input: CreateDeveloperUserInput, req: Request) {
    const { schoolId, email, password, roleIds, sendInvite, ...userData } = input;

    // Check for duplicate email globally
    const existingGlobal = await developerUsersRepository.findByEmail(email);
    if (existingGlobal) {
      throw AppError.conflict("A user with this email already exists");
    }

    // Also check in the specific school
    const existingInSchool = await developerUsersRepository.findByEmailInSchool(schoolId, email);
    if (existingInSchool) {
      throw AppError.conflict("A user with this email already exists in this school");
    }

    // Validate school exists and is active
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw AppError.notFound("School not found");
    }
    if (!school.isActive) {
      throw AppError.badRequest("Cannot create user in inactive school");
    }

    // Validate roles exist and belong to the school
    if (roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds }, schoolId },
      });
      if (roles.length !== roleIds.length) {
        throw AppError.badRequest("One or more roles not found or do not belong to this school");
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          school: { connect: { id: schoolId } },
          email,
          passwordHash,
          ...userData,
          roles: {
            create: roleIds.map((roleId) => ({ role: { connect: { id: roleId } } })),
          },
        },
        include: {
          school: { select: { id: true, name: true, code: true } },
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          },
        },
      });

      return created;
    });

    // Audit log
    await auditService.logFromRequest(
      req,
      "CREATE",
      "User",
      user.id,
      {
        oldValue: null,
        newValue: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolId: user.schoolId,
          roleIds,
        },
      },
      user.schoolId,
      "User created via developer panel"
    );

    return user;
  },

  /**
   * Update user (including moving between schools)
   */
  async updateUser(id: string, input: UpdateDeveloperUserInput, req: Request) {
    const existing = await developerUsersRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("User not found");
    }

    const { roleIds, schoolId: newSchoolId, ...userData } = input;
    const oldSchoolId = existing.schoolId;

    // Check for duplicate email if changing
    if (userData.email && userData.email !== existing.email) {
      const duplicate = await developerUsersRepository.findByEmail(userData.email);
      if (duplicate) {
        throw AppError.conflict("A user with this email already exists");
      }
    }

    // Validate new school if changing
    if (newSchoolId && newSchoolId !== oldSchoolId) {
      const school = await prisma.school.findUnique({ where: { id: newSchoolId } });
      if (!school) {
        throw AppError.notFound("Target school not found");
      }
      if (!school.isActive) {
        throw AppError.badRequest("Cannot move user to inactive school");
      }
    }

    // Validate roles if provided
    const targetSchoolId = newSchoolId ?? oldSchoolId;
    if (roleIds) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds }, schoolId: targetSchoolId },
      });
      if (roles.length !== roleIds.length) {
        throw AppError.badRequest("One or more roles not found or do not belong to the target school");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id },
        data: {
          ...userData,
          ...(newSchoolId && { school: { connect: { id: newSchoolId } } }),
        },
        include: {
          school: { select: { id: true, name: true, code: true } },
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          },
        },
      });

      // Sync roles if provided
      if (roleIds) {
        // Delete existing roles not in the new list
        await tx.userRole.deleteMany({
          where: {
            userId: id,
            roleId: { notIn: roleIds },
          },
        });

        // Add new roles
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });

        // Re-fetch with updated roles
        return tx.user.findUnique({
          where: { id },
          include: {
            school: { select: { id: true, name: true, code: true } },
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        });
      }

      return user;
    });

    // Audit log
    await auditService.logFromRequest(
      req,
      "UPDATE",
      "User",
      id,
      {
        oldValue: {
          email: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          phone: existing.phone,
          isActive: existing.isActive,
          schoolId: existing.schoolId,
          roleIds: existing.roles.map((r) => r.roleId),
        },
        newValue: {
          ...userData,
          ...(roleIds && { roleIds }),
          ...(newSchoolId && { schoolId: newSchoolId }),
        },
      },
      updated!.schoolId,
      "User updated via developer panel"
    );

    return updated!;
  },

  /**
   * Soft delete (deactivate) or hard delete user
   */
  async deleteUser(id: string, req: Request, hardDelete = false) {
    const existing = await developerUsersRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("User not found");
    }

    if (hardDelete) {
      await developerUsersRepository.delete(id);

      await auditService.logFromRequest(
        req,
        "DELETE",
        "User",
        id,
        {
          oldValue: {
            email: existing.email,
            firstName: existing.firstName,
            lastName: existing.lastName,
            schoolId: existing.schoolId,
          },
          newValue: null,
        },
        existing.schoolId,
        "User permanently deleted via developer panel"
      );
    } else {
      const updated = await developerUsersRepository.update(id, { isActive: false });

      await auditService.logFromRequest(
        req,
        "DEACTIVATE",
        "User",
        id,
        {
          oldValue: { isActive: true },
          newValue: { isActive: false },
        },
        existing.schoolId,
        "User deactivated via developer panel"
      );

      return updated;
    }
  },

  /**
   * Bulk action on users
   */
  async bulkAction(input: BulkActionInput, req: Request) {
    const { userIds, action } = input;
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        const existing = await developerUsersRepository.findById(userId);
        if (!existing) {
          results.push({ id: userId, success: false, error: "User not found" });
          continue;
        }

        if (action === "delete") {
          await developerUsersRepository.delete(userId);
          await auditService.logFromRequest(
            req,
            "DELETE",
            "User",
            userId,
            { oldValue: { email: existing.email }, newValue: null },
            existing.schoolId,
            `Bulk delete via developer panel`
          );
        } else if (action === "activate") {
          await developerUsersRepository.update(userId, { isActive: true });
          await auditService.logFromRequest(
            req,
            "ACTIVATE",
            "User",
            userId,
            { oldValue: { isActive: false }, newValue: { isActive: true } },
            existing.schoolId,
            `Bulk activate via developer panel`
          );
        } else if (action === "deactivate") {
          await developerUsersRepository.update(userId, { isActive: false });
          await auditService.logFromRequest(
            req,
            "DEACTIVATE",
            "User",
            userId,
            { oldValue: { isActive: true }, newValue: { isActive: false } },
            existing.schoolId,
            `Bulk deactivate via developer panel`
          );
        }

        results.push({ id: userId, success: true });
      } catch (error) {
        results.push({ id: userId, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return results;
  },

  /**
   * Reset user password (generate temp password or use provided)
   */
  async resetPassword(id: string, input: ResetPasswordInput, req: Request) {
    const existing = await developerUsersRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("User not found");
    }

    const newPassword = input.newPassword || generateTempPassword();
    const passwordHash = await hashPassword(newPassword);

    await developerUsersRepository.updatePassword(id, passwordHash);

    await auditService.logFromRequest(
      req,
      "PASSWORD_RESET",
      "User",
      id,
      {
        oldValue: null,
        newValue: { passwordChanged: true, tempPassword: !input.newPassword },
      },
      existing.schoolId,
      "Password reset via developer panel"
    );

    return { tempPassword: newPassword, mustChange: true };
  },

  /**
   * Get all active schools for dropdown
   */
  async getSchools() {
    return developerUsersRepository.getSchools();
  },

  /**
   * Get roles for a specific school
   */
  async getRoles(schoolId: string) {
    return developerUsersRepository.getRoles(schoolId);
  },
};

export type DeveloperUsersService = typeof developerUsersService;
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { roleRepository } from "./role.repository.js";
import type { CreateRoleInput, UpdateRoleInput, ListRolesQuery } from "./role.schemas.js";

const roleService = (() => {
  const repo = roleRepository;

  return {
    async createRole(schoolId: string, input: CreateRoleInput) {
      // Check for duplicate name
      const existing = await repo.findByName(schoolId, input.name);
      if (existing) {
        throw AppError.conflict("A role with this name already exists");
      }

      // Validate permissions exist
      if (input.permissions.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: input.permissions } },
        });
        if (permissions.length !== input.permissions.length) {
          const foundKeys = new Set(permissions.map((p) => p.key));
          const invalid = input.permissions.filter((k) => !foundKeys.has(k));
          throw AppError.badRequest(`Invalid permissions: ${invalid.join(", ")}`);
        }
      }

      return repo.create({
        school: { connect: { id: schoolId } },
        name: input.name,
        description: input.description,
        permissions: {
          create: input.permissions.map((key) => ({
            permission: { connect: { key } },
          })),
        },
      });
    },

    async getRole(schoolId: string, id: string) {
      const role = await repo.findById(id);
      if (!role || role.schoolId !== schoolId) {
        throw AppError.notFound("Role not found");
      }
      return role;
    },

    async listRoles(schoolId: string, query: ListRolesQuery) {
      return repo.findMany(schoolId, query);
    },

    async updateRole(schoolId: string, id: string, input: UpdateRoleInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Role not found");
      }

      // Prevent modification of system roles
      if (existing.isSystem) {
        throw AppError.forbidden("Cannot modify system roles");
      }

      // Check for duplicate name (if changing)
      if (input.name && input.name !== existing.name) {
        const duplicate = await repo.findByName(schoolId, input.name);
        if (duplicate) {
          throw AppError.conflict("A role with this name already exists");
        }
      }

      // Validate permissions if provided
      if (input.permissions) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: input.permissions } },
        });
        if (permissions.length !== input.permissions.length) {
          const foundKeys = new Set(permissions.map((p) => p.key));
          const invalid = input.permissions.filter((k) => !foundKeys.has(k));
          throw AppError.badRequest(`Invalid permissions: ${invalid.join(", ")}`);
        }
      }

      // Update role basic info
      const updated = await repo.update(id, {
        name: input.name,
        description: input.description,
      });

      // Sync permissions if provided
      if (input.permissions) {
        return repo.syncPermissions(id, input.permissions);
      }

      return updated;
    },

    async deleteRole(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Role not found");
      }

      // Prevent deletion of system roles
      if (existing.isSystem) {
        throw AppError.forbidden("Cannot delete system roles");
      }

      // Check if role is assigned to any users
      const userRoles = await prisma.userRole.count({ where: { roleId: id } });
      if (userRoles > 0) {
        throw AppError.conflict("Cannot delete role assigned to users");
      }

      return repo.delete(id);
    },
  };
})();

export { roleService };
export type RoleService = typeof roleService;
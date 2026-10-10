import { developerRepository } from "./developer.repository.js";
import { auditService } from "../../lib/audit.js";
import type { Request } from "express";
import type { ListSchoolsQuery, DashboardQuery, ListLogsQuery } from "./developer.schemas.js";

// Type alias to ensure we use Express Request
type ExpressRequest = Request;

export const developerService = {
  /** List all schools */
  async listSchools(query: ListSchoolsQuery) {
    return developerRepository.findSchools(query);
  },

  /** Get school by ID */
  async getSchool(id: string) {
    return developerRepository.findSchoolById(id);
  },

  /** Get dashboard aggregates */
  async getDashboard(query: DashboardQuery) {
    return developerRepository.getDashboardAggregates(query.schoolId);
  },

  /** List audit logs */
  async listLogs(query: ListLogsQuery) {
    return developerRepository.findLogs({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  },

  /** List all roles across schools */
  async listRoles(query: {
    page: number;
    limit: number;
    search?: string;
    isSystem?: boolean;
    schoolId?: string;
  }) {
    return developerRepository.findRoles(query);
  },

  /** Get role by ID */
  async getRole(id: string) {
    return developerRepository.findRoleById(id);
  },

  /** Create a new role */
  async createRole(input: {
    schoolId: string;
    name: string;
    description?: string;
    isSystem: boolean;
    permissions: string[];
  }, req: ExpressRequest) {
    const role = await developerRepository.createRole(input);

    await auditService.logFromRequest(
      req,
      "CREATE",
      "Role",
      role.id,
      { oldValue: null, newValue: { name: role.name, isSystem: role.isSystem, permissions: role.permissions } },
      input.schoolId,
      "Role created"
    );

    return role;
  },

  /** Update a role */
  async updateRole(id: string, input: {
    name?: string;
    description?: string;
    permissions?: string[];
  }, req: ExpressRequest) {
    const existing = await developerRepository.findRoleById(id);
    if (!existing) throw new Error("Role not found");

    const updated = await developerRepository.updateRole(id, input);

    await auditService.logFromRequest(
      req,
      "UPDATE",
      "Role",
      id,
      {
        oldValue: { name: existing.name, isSystem: existing.isSystem, permissions: existing.permissions },
        newValue: input,
      },
      existing.schoolId || undefined,
      "Role updated"
    );

    return updated;
  },

  /** Delete a role */
  async deleteRole(id: string, req: ExpressRequest) {
    const existing = await developerRepository.findRoleById(id);
    if (!existing) throw new Error("Role not found");

    await developerRepository.deleteRole(id);

    await auditService.logFromRequest(
      req,
      "DELETE",
      "Role",
      id,
      { oldValue: { name: existing.name, isSystem: existing.isSystem }, newValue: null },
      existing.schoolId || undefined,
      "Role deleted"
    );

    return { message: "Role deleted successfully" };
  },
};
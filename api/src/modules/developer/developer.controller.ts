import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { developerService } from "./developer.service.js";
import type { ListSchoolsQuery, DashboardQuery, ListLogsQuery } from "./developer.schemas.js";

export const developerController = {
  /** GET /developer/schools - List all schools */
  async listSchools(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListSchoolsQuery }>(res);
    const result = await developerService.listSchools(query);
    res.json({ data: result });
  },

  /** GET /developer/schools/:id - Get school by ID */
  async getSchool(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const school = await developerService.getSchool(params.id);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    res.json({ data: school });
  },

  /** GET /developer/dashboard - Get dashboard aggregates */
  async getDashboard(req: Request, res: Response) {
    const { query } = getValidated<{ query: DashboardQuery }>(res);
    const data = await developerService.getDashboard(query);
    res.json({ data });
  },

  /** GET /developer/current-school - Get current school for user */
  async getCurrentSchool(req: Request, res: Response) {
    // This endpoint can be used by non-developers to get their school info
    const schoolId = req.auth?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "No school context" });
    }
    const school = await developerService.getSchool(schoolId);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    res.json({ data: school });
  },

  /** GET /developer/logs - List audit logs */
  async listLogs(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListLogsQuery }>(res);
    const result = await developerService.listLogs(query);
    res.json({ data: result });
  },

  /** GET /developer/roles - List all roles */
  async listRoles(req: Request, res: Response) {
    const { query } = getValidated<{ query: {
      page: number;
      limit: number;
      search?: string;
      isSystem?: boolean;
      schoolId?: string;
    } }>(res);
    const result = await developerService.listRoles(query);
    res.json({ data: result });
  },

  /** GET /developer/roles/:id - Get role by ID */
  async getRole(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const role = await developerService.getRole(params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json({ data: role });
  },

  /** POST /developer/roles - Create role */
  async createRole(req: Request, res: Response) {
    const { body } = getValidated<{ body: {
      schoolId: string;
      name: string;
      description?: string;
      isSystem: boolean;
      permissions: string[];
    } }>(res);
    const role = await developerService.createRole(body, req);
    res.status(201).json({ data: role });
  },

  /** PATCH /developer/roles/:id - Update role */
  async updateRole(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: {
      name?: string;
      description?: string;
      permissions?: string[];
    } }>(res);
    const role = await developerService.updateRole(params.id, body, req);
    res.json({ data: role });
  },

  /** DELETE /developer/roles/:id - Delete role */
  async deleteRole(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const result = await developerService.deleteRole(params.id, req);
    res.json({ data: result });
  },
};
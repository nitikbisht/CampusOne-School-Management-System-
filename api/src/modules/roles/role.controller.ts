import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { roleService } from "./role.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreateRoleInput, UpdateRoleInput, ListRolesQuery } from "./role.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const roleController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateRoleInput }>(res);
    const schoolId = await getSchoolId(req);

    const role = await roleService.createRole(schoolId, body);
    res.status(201).json({ data: role });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const role = await roleService.getRole(schoolId, params.id);
    res.json({ data: role });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListRolesQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await roleService.listRoles(schoolId, query);
    res.json({ data: result });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateRoleInput }>(res);
    const schoolId = await getSchoolId(req);

    const role = await roleService.updateRole(schoolId, params.id, body);
    res.json({ data: role });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await roleService.deleteRole(schoolId, params.id);
    res.json({ data: { message: "Role deleted successfully" } });
  },
};
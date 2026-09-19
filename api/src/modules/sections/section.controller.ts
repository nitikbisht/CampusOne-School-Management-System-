import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateSectionInput, UpdateSectionInput } from "./section.schemas.js";
import { sectionService } from "./section.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const sectionController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await sectionService.list(schoolId) });
  },

  async listByAcademicYear(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { academicYearId: string } }>(res);
    res.json({ data: await sectionService.listByAcademicYear(schoolId, params.academicYearId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await sectionService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateSectionInput }>(res);
    res.status(201).json({ data: await sectionService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateSectionInput }>(res);
    res.json({ data: await sectionService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await sectionService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
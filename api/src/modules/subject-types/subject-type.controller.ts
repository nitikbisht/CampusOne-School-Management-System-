import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateSubjectTypeInput, UpdateSubjectTypeInput } from "./subject-type.schemas.js";
import { subjectTypeService } from "./subject-type.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const subjectTypeController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await subjectTypeService.list(schoolId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await subjectTypeService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateSubjectTypeInput }>(res);
    res.status(201).json({ data: await subjectTypeService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateSubjectTypeInput }>(res);
    res.json({ data: await subjectTypeService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await subjectTypeService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.schemas.js";
import { subjectService } from "./subject.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const subjectController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await subjectService.list(schoolId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await subjectService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateSubjectInput }>(res);
    res.status(201).json({ data: await subjectService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateSubjectInput }>(res);
    res.json({ data: await subjectService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await subjectService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
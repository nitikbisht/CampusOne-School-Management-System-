import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateClassSubjectInput, UpdateClassSubjectInput } from "./class-subject.schemas.js";
import { classSubjectService } from "./class-subject.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const classSubjectController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await classSubjectService.list(schoolId) });
  },

  async listByClass(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { classId: string } }>(res);
    res.json({ data: await classSubjectService.listByClass(schoolId, params.classId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await classSubjectService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateClassSubjectInput }>(res);
    res.status(201).json({ data: await classSubjectService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateClassSubjectInput }>(res);
    res.json({ data: await classSubjectService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await classSubjectService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
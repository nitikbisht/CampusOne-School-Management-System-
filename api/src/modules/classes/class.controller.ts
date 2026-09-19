import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateClassInput, UpdateClassInput } from "./class.schemas.js";
import { classService } from "./class.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const classController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await classService.list(schoolId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await classService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateClassInput }>(res);
    res.status(201).json({ data: await classService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateClassInput }>(res);
    res.json({ data: await classService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await classService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
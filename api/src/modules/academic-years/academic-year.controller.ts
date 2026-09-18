import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateAcademicYearInput } from "./academic-year.schemas.js";
import { academicYearService } from "./academic-year.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const academicYearController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    res.json({ data: await academicYearService.list(schoolId) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await academicYearService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateAcademicYearInput }>(res);
    res.status(201).json({ data: await academicYearService.create(schoolId, body) });
  },

  async activate(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await academicYearService.activate(schoolId, params.id) });
  },
};

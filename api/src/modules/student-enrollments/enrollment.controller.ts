import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateEnrollmentInput, UpdateEnrollmentInput, ListEnrollmentsQuery } from "./enrollment.schemas.js";
import { enrollmentService } from "./enrollment.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const enrollmentController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { query } = getValidated<{ query: ListEnrollmentsQuery }>(res);
    res.json({ data: await enrollmentService.list(schoolId, query) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await enrollmentService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateEnrollmentInput }>(res);
    res.status(201).json({ data: await enrollmentService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateEnrollmentInput }>(res);
    res.json({ data: await enrollmentService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await enrollmentService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
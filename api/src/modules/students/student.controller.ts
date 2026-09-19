import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateStudentInput, UpdateStudentInput, ListStudentsQuery } from "./student.schemas.js";
import { studentService } from "./student.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const studentController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { query } = getValidated<{ query: ListStudentsQuery }>(res);
    res.json({ data: await studentService.list(schoolId, query) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await studentService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateStudentInput }>(res);
    res.status(201).json({ data: await studentService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateStudentInput }>(res);
    res.json({ data: await studentService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await studentService.delete(schoolId, params.id);
    res.status(204).send();
  },
};
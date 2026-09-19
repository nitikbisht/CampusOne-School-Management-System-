import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type { CreateParentInput, UpdateParentInput, ListParentsQuery, LinkChildInput } from "./parent.schemas.js";
import { parentService } from "./parent.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const parentController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { query } = getValidated<{ query: ListParentsQuery }>(res);
    res.json({ data: await parentService.list(schoolId, query) });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await parentService.get(schoolId, params.id) });
  },

  async create(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { body } = getValidated<{ body: CreateParentInput }>(res);
    res.status(201).json({ data: await parentService.create(schoolId, body) });
  },

  async update(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateParentInput }>(res);
    res.json({ data: await parentService.update(schoolId, params.id, body) });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await parentService.delete(schoolId, params.id);
    res.status(204).send();
  },

  async linkChild(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: LinkChildInput }>(res);
    res.status(201).json({ data: await parentService.linkChild(schoolId, params.id, body) });
  },

  async unlinkChild(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string; studentId: string } }>(res);
    await parentService.unlinkChild(schoolId, params.id, params.studentId);
    res.status(204).send();
  },

  async getChildren(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    res.json({ data: await parentService.getChildren(schoolId, params.id) });
  },

  async getParents(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { studentId: string } }>(res);
    res.json({ data: await parentService.getParents(schoolId, params.studentId) });
  },
};
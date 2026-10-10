import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { developerUsersService } from "./developer-users.service.js";
import type { CreateDeveloperUserInput, UpdateDeveloperUserInput, ListDeveloperUsersQuery, ResetPasswordInput, BulkActionInput } from "./developer-users.schemas.js";

function omitPasswordHash<T extends { passwordHash?: string }>(obj: T): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...rest } = obj;
  return rest;
}

export const developerUsersController = {
  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListDeveloperUsersQuery }>(res);

    const result = await developerUsersService.listUsers(query);
    const itemsWithoutPassword = result.items.map((user) => omitPasswordHash(user));
    res.json({ data: { ...result, items: itemsWithoutPassword } });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);

    const user = await developerUsersService.getUser(params.id);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword });
  },

  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateDeveloperUserInput }>(res);

    const user = await developerUsersService.createUser(body, req);
    res.status(201).json({ data: omitPasswordHash(user) });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateDeveloperUserInput }>(res);

    const user = await developerUsersService.updateUser(params.id, body, req);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const { query } = getValidated<{ query: { hard?: string } }>(res);

    const hardDelete = query.hard === "true";
    await developerUsersService.deleteUser(params.id, req, hardDelete);
    res.json({ data: { message: hardDelete ? "User permanently deleted" : "User deactivated successfully" } });
  },

  async bulkAction(req: Request, res: Response) {
    const { body } = getValidated<{ body: BulkActionInput }>(res);

    const results = await developerUsersService.bulkAction(body, req);
    res.json({ data: results });
  },

  async resetPassword(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: ResetPasswordInput }>(res);

    const result = await developerUsersService.resetPassword(params.id, body, req);
    res.json({ data: result });
  },

  async getSchools(req: Request, res: Response) {
    const schools = await developerUsersService.getSchools();
    res.json({ data: schools });
  },

  async getRoles(req: Request, res: Response) {
    const { query } = getValidated<{ query: { schoolId: string } }>(res);

    const roles = await developerUsersService.getRoles(query.schoolId);
    res.json({ data: roles });
  },
};
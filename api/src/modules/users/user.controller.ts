import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { userService } from "./user.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreateUserInput, UpdateUserInput, ListUsersQuery, ChangePasswordInput } from "./user.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

function omitPasswordHash<T extends { passwordHash?: string }>(obj: T): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...rest } = obj;
  return rest;
}

export const userController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateUserInput }>(res);
    const schoolId = await getSchoolId(req);

    const user = await userService.createUser(schoolId, body);
    res.status(201).json({ data: omitPasswordHash(user) });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const user = await userService.getUser(schoolId, params.id);
    // userService.getUser throws if not found, so user is guaranteed to exist
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListUsersQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await userService.listUsers(schoolId, query);
    const itemsWithoutPassword = result.items.map((user) => {
      const { passwordHash: _passwordHash, ...rest } = user;
      return rest;
    });
    res.json({ data: { ...result, items: itemsWithoutPassword } });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateUserInput }>(res);
    const schoolId = await getSchoolId(req);

    const user = await userService.updateUser(schoolId, params.id, body);
    // userService.updateUser throws if not found, so user is guaranteed to exist
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user!;
    res.json({ data: userWithoutPassword });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await userService.deleteUser(schoolId, params.id);
    res.json({ data: { message: "User deleted successfully" } });
  },

  async changePassword(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: ChangePasswordInput }>(res);
    const schoolId = await getSchoolId(req);

    const result = await userService.changePassword(schoolId, params.id, body);
    res.json({ data: result });
  },
};
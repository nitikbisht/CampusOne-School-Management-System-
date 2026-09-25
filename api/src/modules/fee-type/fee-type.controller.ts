import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { feeTypeService } from "./fee-type.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreateFeeTypeInput, UpdateFeeTypeInput, ListFeeTypesQuery } from "./fee-type.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const feeTypeController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateFeeTypeInput }>(res);
    const schoolId = await getSchoolId(req);

    const feeType = await feeTypeService.createFeeType(schoolId, body);
    res.status(201).json({ data: feeType });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const feeType = await feeTypeService.getFeeType(schoolId, params.id);
    res.json({ data: feeType });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListFeeTypesQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await feeTypeService.listFeeTypes(schoolId, query);
    res.json({ data: result });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateFeeTypeInput }>(res);
    const schoolId = await getSchoolId(req);

    const feeType = await feeTypeService.updateFeeType(schoolId, params.id, body);
    res.json({ data: feeType });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await feeTypeService.deleteFeeType(schoolId, params.id);
    res.json({ data: { message: "Fee type deleted successfully" } });
  },
};
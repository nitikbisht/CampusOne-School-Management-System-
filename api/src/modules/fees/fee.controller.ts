import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { feeService } from "./fee.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreateFeeInput, UpdateFeeInput, ListFeesQuery } from "./fee.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const feeController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateFeeInput }>(res);
    const schoolId = await getSchoolId(req);

    const fee = await feeService.createFee(schoolId, body);
    res.status(201).json({ data: fee });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const fee = await feeService.getFee(schoolId, params.id);
    res.json({ data: fee });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListFeesQuery }>(res);
    const schoolId = await getSchoolId(req);
    console.log("Fee list request:", { schoolId, query });

    try {
      const result = await feeService.listFees(schoolId, query);
      console.log("Fee list result:", { itemsCount: result.items.length, total: result.total });
      res.json({ data: result });
    } catch (err) {
      console.error("Fee list error:", err);
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateFeeInput }>(res);
    const schoolId = await getSchoolId(req);

    const fee = await feeService.updateFee(schoolId, params.id, body);
    res.json({ data: fee });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await feeService.deleteFee(schoolId, params.id);
    res.json({ data: { message: "Fee deleted successfully" } });
  },
};
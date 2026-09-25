import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { receiptService } from "./receipt.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { ListReceiptsQuery } from "./receipt.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

async function getUserId(req: Request): Promise<string> {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) throw new Error("Missing x-user-id header");
  return userId;
}

export const receiptController = {
  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const receipt = await receiptService.getReceipt(schoolId, params.id);
    res.json({ data: receipt });
  },

  async getByPayment(req: Request, res: Response) {
    const { params } = getValidated<{ params: { paymentId: string } }>(res);
    const schoolId = await getSchoolId(req);

    const receipt = await receiptService.getReceiptByPayment(schoolId, params.paymentId);
    res.json({ data: receipt });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListReceiptsQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await receiptService.listReceipts(schoolId, query);
    res.json({ data: result });
  },

  async generate(req: Request, res: Response) {
    const { params } = getValidated<{ params: { paymentId: string } }>(res);
    const schoolId = await getSchoolId(req);
    const userId = await getUserId(req);

    const receipt = await receiptService.generateReceipt(schoolId, userId, params.paymentId);
    res.status(201).json({ data: receipt });
  },

  async download(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const receipt = await receiptService.downloadReceipt(schoolId, params.id);
    // In a real implementation, this would generate and return a PDF
    // For now, return the receipt data with a flag indicating it's for download
    res.json({ data: receipt, download: true });
  },
};
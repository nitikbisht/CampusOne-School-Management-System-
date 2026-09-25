import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { paymentService } from "./payment.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreatePaymentInput, UpdatePaymentInput, ListPaymentsQuery } from "./payment.schemas.js";

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

export const paymentController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreatePaymentInput }>(res);
    const schoolId = await getSchoolId(req);
    const userId = await getUserId(req);

    const payment = await paymentService.createPayment(schoolId, userId, body);
    res.status(201).json({ data: payment });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const payment = await paymentService.getPayment(schoolId, params.id);
    res.json({ data: payment });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListPaymentsQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await paymentService.listPayments(schoolId, query);
    res.json({ data: result });
  },

  async listByStudent(req: Request, res: Response) {
    const { params, query } = getValidated<{ params: { studentId: string }; query: { academicYearId?: string } }>(res);
    const schoolId = await getSchoolId(req);

    const payments = await paymentService.listPaymentsByStudent(schoolId, params.studentId, query.academicYearId);
    res.json({ data: payments });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdatePaymentInput }>(res);
    const schoolId = await getSchoolId(req);

    const payment = await paymentService.updatePayment(schoolId, params.id, body);
    res.json({ data: payment });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await paymentService.deletePayment(schoolId, params.id);
    res.json({ data: { message: "Payment deleted successfully" } });
  },
};
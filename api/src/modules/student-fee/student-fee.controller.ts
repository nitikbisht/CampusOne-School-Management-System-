import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { studentFeeService } from "./student-fee.service.js";
import { schoolRepository } from "../auth/school.repository.js";
import type { CreateStudentFeeInput, BulkAssignStudentFeeInput, UpdateStudentFeeInput, ListStudentFeesQuery } from "./student-fee.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const studentFeeController = {
  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateStudentFeeInput }>(res);
    const schoolId = await getSchoolId(req);

    const studentFee = await studentFeeService.createStudentFee(schoolId, body);
    res.status(201).json({ data: studentFee });
  },

  async bulkAssign(req: Request, res: Response) {
    const { body } = getValidated<{ body: BulkAssignStudentFeeInput }>(res);
    const schoolId = await getSchoolId(req);

    const result = await studentFeeService.bulkAssignStudentFees(schoolId, body);
    res.status(201).json({ data: result });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    const studentFee = await studentFeeService.getStudentFee(schoolId, params.id);
    res.json({ data: studentFee });
  },

  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListStudentFeesQuery }>(res);
    const schoolId = await getSchoolId(req);

    const result = await studentFeeService.listStudentFees(schoolId, query);
    res.json({ data: result });
  },

  async listByStudent(req: Request, res: Response) {
    const { params, query } = getValidated<{ params: { studentId: string }; query: { academicYearId?: string } }>(res);
    const schoolId = await getSchoolId(req);

    const studentFees = await studentFeeService.listStudentFeesByStudent(schoolId, params.studentId, query.academicYearId);
    res.json({ data: studentFees });
  },

  async getSummary(req: Request, res: Response) {
    const { params } = getValidated<{ params: { studentId: string; academicYearId: string } }>(res);
    const schoolId = await getSchoolId(req);

    const summary = await studentFeeService.getStudentFeeSummary(schoolId, params.studentId, params.academicYearId);
    res.json({ data: summary });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateStudentFeeInput }>(res);
    const schoolId = await getSchoolId(req);

    const studentFee = await studentFeeService.updateStudentFee(schoolId, params.id, body);
    res.json({ data: studentFee });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const schoolId = await getSchoolId(req);

    await studentFeeService.deleteStudentFee(schoolId, params.id);
    res.json({ data: { message: "Student fee deleted successfully" } });
  },
};
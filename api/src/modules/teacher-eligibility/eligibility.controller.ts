import { Request, Response } from "express";
import { schoolRepository } from "../auth/school.repository.js";
import { eligibilityService } from "./eligibility.service.js";
import { idParamSchema, createEligibilitySchema, updateEligibilitySchema, listEligibilitiesQuerySchema } from "./eligibility.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const eligibilityController = {
  async list(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listEligibilitiesQuerySchema.parse(req.query);
    const result = await eligibilityService.list(schoolId, query);
    res.json({ data: result });
  },

  async getById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const eligibility = await eligibilityService.getById(schoolId, id);
    res.json({ data: eligibility });
  },

  async create(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createEligibilitySchema.parse(req.body);
    const eligibility = await eligibilityService.create(schoolId, input);
    res.status(201).json({ data: eligibility });
  },

  async update(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateEligibilitySchema.parse(req.body);
    const eligibility = await eligibilityService.update(schoolId, id, input);
    res.json({ data: eligibility });
  },

  async delete(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await eligibilityService.delete(schoolId, id);
    res.json({ data: { message: "Teacher eligibility deleted successfully" } });
  },

  async checkEligibility(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { teacherId, subjectId, classId } = req.query;
    if (!teacherId || !subjectId || !classId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "teacherId, subjectId, and classId are required" } });
    }
    const eligible = await eligibilityService.checkEligibility(schoolId, teacherId as string, subjectId as string, classId as string);
    res.json({ data: { eligible } });
  },
};
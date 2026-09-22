import { Request, Response } from "express";
import { schoolRepository } from "../auth/school.repository.js";
import { assignmentService } from "./assignment.service.js";
import { idParamSchema, createAssignmentSchema, updateAssignmentSchema, listAssignmentsQuerySchema } from "./assignment.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const assignmentController = {
  async list(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listAssignmentsQuerySchema.parse(req.query);
    const result = await assignmentService.list(schoolId, query);
    res.json({ data: result });
  },

  async getById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const assignment = await assignmentService.getById(schoolId, id);
    res.json({ data: assignment });
  },

  async create(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createAssignmentSchema.parse(req.body);
    const assignment = await assignmentService.create(schoolId, input);
    res.status(201).json({ data: assignment });
  },

  async update(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateAssignmentSchema.parse(req.body);
    const assignment = await assignmentService.update(schoolId, id, input);
    res.json({ data: assignment });
  },

  async delete(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await assignmentService.delete(schoolId, id);
    res.json({ data: { message: "Teacher assignment deleted successfully" } });
  },

  async getByTeacherYear(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { teacherId, academicYearId } = req.query;
    if (!teacherId || !academicYearId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "teacherId and academicYearId are required" } });
    }
    const assignments = await assignmentService.getByTeacherYear(schoolId, teacherId as string, academicYearId as string);
    res.json({ data: assignments });
  },

  async getByClassSectionYear(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { classId, sectionId, academicYearId } = req.query;
    if (!classId || !sectionId || !academicYearId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "classId, sectionId, and academicYearId are required" } });
    }
    const assignments = await assignmentService.getByClassSectionYear(schoolId, classId as string, sectionId as string, academicYearId as string);
    res.json({ data: assignments });
  },
};
import { Request, Response } from "express";
import { schoolRepository } from "../auth/school.repository.js";
import { examService } from "./exam.service.js";
import {
  idParamSchema,
  createExamSchema,
  updateExamSchema,
  listExamsQuerySchema,
  createExamSubjectSchema,
  updateExamSubjectSchema,
  listExamSubjectsQuerySchema,
  createExamAssessmentComponentSchema,
  updateExamAssessmentComponentSchema,
  listExamAssessmentComponentsQuerySchema,
  createExamScheduleSchema,
  updateExamScheduleSchema,
  listExamSchedulesQuerySchema,
} from "./exam.schemas.js";

async function getSchoolId(req: Request): Promise<string> {
  const schoolIdOrCode = req.headers["x-school-id"] as string;
  if (!schoolIdOrCode) throw new Error("Missing x-school-id header");
  const school = await schoolRepository.findByIdOrCode(schoolIdOrCode);
  if (!school) throw new Error("Invalid school");
  return school.id;
}

export const examController = {
  // Exam endpoints
  async list(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listExamsQuerySchema.parse(req.query);
    const result = await examService.list(schoolId, query);
    res.json({ data: result });
  },

  async getById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const exam = await examService.getById(schoolId, id);
    res.json({ data: exam });
  },

  async create(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createExamSchema.parse(req.body);
    const exam = await examService.create(schoolId, input);
    res.status(201).json({ data: exam });
  },

  async update(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateExamSchema.parse(req.body);
    const exam = await examService.update(schoolId, id, input);
    res.json({ data: exam });
  },

  async delete(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await examService.delete(schoolId, id);
    res.json({ data: { message: "Exam deleted successfully" } });
  },

  async publish(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const exam = await examService.publish(schoolId, id);
    res.json({ data: exam });
  },

  // ExamSubject endpoints
  async listSubjects(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listExamSubjectsQuerySchema.parse(req.query);
    const result = await examService.listSubjects(schoolId, query);
    res.json({ data: result });
  },

  async getSubjectById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const subject = await examService.getSubjectById(schoolId, id);
    res.json({ data: subject });
  },

  async createSubject(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createExamSubjectSchema.parse(req.body);
    const subject = await examService.createSubject(schoolId, input);
    res.status(201).json({ data: subject });
  },

  async updateSubject(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateExamSubjectSchema.parse(req.body);
    const subject = await examService.updateSubject(schoolId, id, input);
    res.json({ data: subject });
  },

  async deleteSubject(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await examService.deleteSubject(schoolId, id);
    res.json({ data: { message: "Exam subject deleted successfully" } });
  },

  // ExamAssessmentComponent endpoints
  async listComponents(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listExamAssessmentComponentsQuerySchema.parse(req.query);
    const result = await examService.listComponents(schoolId, query);
    res.json({ data: result });
  },

  async getComponentById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const component = await examService.getComponentById(schoolId, id);
    res.json({ data: component });
  },

  async createComponent(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createExamAssessmentComponentSchema.parse(req.body);
    const component = await examService.createComponent(schoolId, input);
    res.status(201).json({ data: component });
  },

  async updateComponent(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateExamAssessmentComponentSchema.parse(req.body);
    const component = await examService.updateComponent(schoolId, id, input);
    res.json({ data: component });
  },

  async deleteComponent(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await examService.deleteComponent(schoolId, id);
    res.json({ data: { message: "Exam assessment component deleted successfully" } });
  },

  // ExamSchedule endpoints
  async listSchedules(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const query = listExamSchedulesQuerySchema.parse(req.query);
    const result = await examService.listSchedules(schoolId, query);
    res.json({ data: result });
  },

  async getScheduleById(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const schedule = await examService.getScheduleById(schoolId, id);
    res.json({ data: schedule });
  },

  async createSchedule(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const input = createExamScheduleSchema.parse(req.body);
    const schedule = await examService.createSchedule(schoolId, input);
    res.status(201).json({ data: schedule });
  },

  async updateSchedule(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateExamScheduleSchema.parse(req.body);
    const schedule = await examService.updateSchedule(schoolId, id, input);
    res.json({ data: schedule });
  },

  async deleteSchedule(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { id } = idParamSchema.parse(req.params);
    await examService.deleteSchedule(schoolId, id);
    res.json({ data: { message: "Exam schedule deleted successfully" } });
  },

  // Helper endpoints
  async getByAcademicYear(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const academicYearId = Array.isArray(req.params.academicYearId) ? req.params.academicYearId[0] : req.params.academicYearId;
    if (!academicYearId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "academicYearId is required" } });
    }
    const exams = await examService.getByAcademicYear(schoolId, academicYearId);
    res.json({ data: exams });
  },

  async getByClassSection(req: Request, res: Response) {
    const schoolId = await getSchoolId(req);
    const { classId, sectionId, academicYearId } = req.query;
    if (!classId || !sectionId || !academicYearId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "classId, sectionId, and academicYearId are required" } });
    }
    const schedules = await examService.getByClassSection(schoolId, classId as string, sectionId as string, academicYearId as string);
    res.json({ data: schedules });
  },
};
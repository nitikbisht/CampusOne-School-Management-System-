import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import type {
  CreateStudentMarkInput,
  UpdateStudentMarkInput,
  ListStudentMarksQuery,
  BulkStudentMarksInput,
  BulkPublishMarksInput,
} from "./student-mark.schemas.js";
import { studentMarkService } from "./student-mark.service.js";

/** HTTP only: read the request, call the service, shape the response. */
export const studentMarkController = {
  async list(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { query } = getValidated<{ query: ListStudentMarksQuery }>(res);
    const result = await studentMarkService.list(schoolId, query);
    res.json({ data: result });
  },

  async get(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    const mark = await studentMarkService.get(schoolId, params.id);
    res.json({ data: mark });
  },

  async create(req: Request, res: Response) {
    const { schoolId, userId } = getAuth(req);
    const { body } = getValidated<{ body: CreateStudentMarkInput }>(res);
    const mark = await studentMarkService.create(schoolId, body, userId);
    res.status(201).json({ data: mark });
  },

  async update(req: Request, res: Response) {
    const { schoolId, userId } = getAuth(req);
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateStudentMarkInput }>(res);
    const mark = await studentMarkService.update(schoolId, params.id, body, userId);
    res.json({ data: mark });
  },

  async delete(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { id: string } }>(res);
    await studentMarkService.delete(schoolId, params.id);
    res.status(204).send();
  },

  // Bulk operations
  async bulkUpsert(req: Request, res: Response) {
    const { schoolId, userId } = getAuth(req);
    const { body } = getValidated<{ body: BulkStudentMarksInput }>(res);
    const marks = await studentMarkService.bulkUpsert(schoolId, body, userId);
    res.status(201).json({ data: marks, message: `${marks.length} mark entries upserted` });
  },

  async bulkPublish(req: Request, res: Response) {
    const { schoolId, userId } = getAuth(req);
    const { body } = getValidated<{ body: BulkPublishMarksInput }>(res);
    const result = await studentMarkService.bulkPublish(schoolId, body, userId);
    res.json({ data: result });
  },

  // Specialized queries
  async getByExamSubject(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { examSubjectId: string } }>(res);
    const result = await studentMarkService.getByExamSubject(schoolId, params.examSubjectId);
    res.json({ data: result });
  },

  async getByStudent(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params, query } = getValidated<{ params: { studentId: string }; query: { academicYearId?: string } }>(res);
    const marks = await studentMarkService.getByStudent(schoolId, params.studentId, query.academicYearId);
    res.json({ data: marks });
  },

  async getConsolidated(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { examId: string; classId: string; sectionId: string } }>(res);
    const result = await studentMarkService.getConsolidated(schoolId, params.examId, params.classId, params.sectionId);
    res.json({ data: result });
  },

  async getValidationStatus(req: Request, res: Response) {
    const { schoolId } = getAuth(req);
    const { params } = getValidated<{ params: { examSubjectId: string } }>(res);
    const result = await studentMarkService.getValidationStatus(schoolId, params.examSubjectId);
    res.json({ data: result });
  },
};
import { AppError } from "../../lib/errors.js";
import type {
  CreateStudentMarkInput,
  UpdateStudentMarkInput,
  ListStudentMarksQuery,
  BulkStudentMarksInput,
  BulkPublishMarksInput,
} from "./student-mark.schemas.js";
import { studentMarkRepository, type StudentMarkRepository } from "./student-mark.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createStudentMarkService(repo: StudentMarkRepository) {
  return {
    async list(schoolId: string, query: ListStudentMarksQuery) {
      return repo.list(schoolId, query);
    },

    async get(schoolId: string, id: string) {
      const mark = await repo.findById(schoolId, id);
      if (!mark) throw AppError.notFound("Student mark not found");
      return mark;
    },

    async create(schoolId: string, input: CreateStudentMarkInput, enteredById: string) {
      // Validate references exist and belong to school
      await this.validateReferences(schoolId, input);

      // Check if marks already exist (unique constraint)
      const existing = await prisma.studentMark.findFirst({
        where: {
          studentId: input.studentId,
          examSubjectId: input.examSubjectId,
          assessmentCompId: input.assessmentCompId,
        },
      });
      if (existing) {
        throw AppError.conflict("Marks already exist for this student, exam subject, and component");
      }

      // Validate marks against component max marks
      await this.validateMarks(input);

      return repo.create(schoolId, { ...input, schoolId, enteredById });
    },

    async update(schoolId: string, id: string, input: UpdateStudentMarkInput, enteredById: string) {
      const existing = await repo.findById(schoolId, id);
      if (!existing) throw AppError.notFound("Student mark not found");

      // Validate marks if being updated
      if (input.marksObtained !== undefined || input.isAbsent !== undefined) {
        await this.validateMarks({
          studentId: existing.studentId,
          examSubjectId: existing.examSubjectId,
          assessmentCompId: existing.assessmentCompId,
          marksObtained: input.marksObtained ?? existing.marksObtained,
          isAbsent: input.isAbsent ?? existing.isAbsent,
        } as CreateStudentMarkInput);
      }

      // If publishing (isDraft: false), ensure marks are valid
      if (input.isDraft === false) {
        if (existing.marksObtained === null && !existing.isAbsent) {
          throw AppError.badRequest("Cannot publish: marks not entered and student not marked absent");
        }
      }

      return repo.update(schoolId, id, { ...input, enteredById });
    },

    async delete(schoolId: string, id: string) {
      const existing = await repo.findById(schoolId, id);
      if (!existing) throw AppError.notFound("Student mark not found");

      // Prevent deletion of published marks
      if (!existing.isDraft) {
        throw AppError.badRequest("Cannot delete published marks. Unpublish first.");
      }

      return repo.delete(schoolId, id);
    },

    // Bulk upsert marks for an exam subject
    async bulkUpsert(
      schoolId: string,
      input: BulkStudentMarksInput,
      enteredById: string
    ) {
      // Validate exam subject exists
      const examSubject = await prisma.examSubject.findFirst({
        where: { id: input.examSubjectId, schoolId },
        include: { exam: true, components: { where: { isActive: true } } },
      });
      if (!examSubject) throw AppError.notFound("Exam subject not found");

      const academicYearId = examSubject.exam.academicYearId;
      const examId = examSubject.examId;

      // Validate all assessment components belong to this exam subject
      const validCompIds = new Set(examSubject.components.map((c) => c.id));
      for (const mark of input.marks) {
        if (!validCompIds.has(mark.assessmentCompId)) {
          throw AppError.badRequest(`Assessment component ${mark.assessmentCompId} does not belong to this exam subject`);
        }
      }

      // Validate all students are enrolled in this class/academic year
      const studentIds = input.marks.map((m) => m.studentId);
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          academicYearId,
          classId: examSubject.classId,
          studentId: { in: studentIds },
          isActive: true,
        },
        select: { studentId: true },
      });
      const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));
      for (const studentId of studentIds) {
        if (!enrolledStudentIds.has(studentId)) {
          throw AppError.badRequest(`Student ${studentId} is not enrolled in this class for this academic year`);
        }
      }

      // Validate marks for each entry
      for (const mark of input.marks) {
        await this.validateMarks({
          studentId: mark.studentId,
          examSubjectId: input.examSubjectId,
          assessmentCompId: mark.assessmentCompId,
          marksObtained: mark.marksObtained ?? null,
          isAbsent: mark.isAbsent,
        } as CreateStudentMarkInput);
      }

      return repo.bulkUpsert(schoolId, input, enteredById, academicYearId, examId);
    },

    // Bulk publish marks for an exam subject
    async bulkPublish(schoolId: string, input: BulkPublishMarksInput, enteredById: string) {
      const examSubject = await prisma.examSubject.findFirst({
        where: { id: input.examSubjectId, schoolId },
        include: { components: { where: { isActive: true } } },
      });
      if (!examSubject) throw AppError.notFound("Exam subject not found");

      const compIds = input.assessmentCompIds?.length ? input.assessmentCompIds : examSubject.components.map((c) => c.id);

      // Get all draft marks for these components
      const draftMarks = await prisma.studentMark.findMany({
        where: {
          schoolId,
          examSubjectId: input.examSubjectId,
          assessmentCompId: { in: compIds },
          isDraft: true,
        },
      });

      if (draftMarks.length === 0) {
        throw AppError.badRequest("No draft marks found to publish");
      }

      // Validate all marks are entered (not null unless absent)
      for (const mark of draftMarks) {
        if (mark.marksObtained === null && !mark.isAbsent) {
          throw AppError.badRequest(`Student ${mark.studentId} has missing marks for component ${mark.assessmentCompId}`);
        }
      }

      // Publish all
      await prisma.studentMark.updateMany({
        where: {
          schoolId,
          examSubjectId: input.examSubjectId,
          assessmentCompId: { in: compIds },
          isDraft: true,
        },
        data: { isDraft: false, enteredById },
      });

      return { publishedCount: draftMarks.length };
    },

    // Get mark sheet for an exam subject
    async getByExamSubject(schoolId: string, examSubjectId: string) {
      const result = await repo.getByExamSubject(schoolId, examSubjectId);
      if (!result) throw AppError.notFound("Exam subject not found");
      return result;
    },

    // Get marks for a student
    async getByStudent(schoolId: string, studentId: string, academicYearId?: string) {
      return repo.getByStudent(schoolId, studentId, academicYearId);
    },

    // Get consolidated marks for class/section/exam
    async getConsolidated(schoolId: string, examId: string, classId: string, sectionId: string) {
      const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId } });
      if (!exam) throw AppError.notFound("Exam not found");
      return repo.getConsolidated(schoolId, examId, classId, sectionId);
    },

    // Validation status
    async getValidationStatus(schoolId: string, examSubjectId: string) {
      return repo.getValidationStatus(schoolId, examSubjectId);
    },

    // Private validation helpers
    async validateReferences(schoolId: string, input: CreateStudentMarkInput) {
      const [student, academicYear, exam, examSubject, assessmentComp] = await Promise.all([
        prisma.student.findFirst({ where: { id: input.studentId, schoolId } }),
        prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } }),
        prisma.exam.findFirst({ where: { id: input.examId, schoolId } }),
        prisma.examSubject.findFirst({ where: { id: input.examSubjectId, schoolId } }),
        prisma.examAssessmentComponent.findFirst({ where: { id: input.assessmentCompId, schoolId } }),
      ]);

      if (!student) throw AppError.notFound("Student not found in this school");
      if (!academicYear) throw AppError.notFound("Academic year not found in this school");
      if (!exam) throw AppError.notFound("Exam not found in this school");
      if (!examSubject) throw AppError.notFound("Exam subject not found in this school");
      if (!assessmentComp) throw AppError.notFound("Assessment component not found in this school");

      // Cross-validate relationships
      if (examSubject.examId !== input.examId) {
        throw AppError.badRequest("Exam subject does not belong to the specified exam");
      }
      if (assessmentComp.examSubjectId !== input.examSubjectId) {
        throw AppError.badRequest("Assessment component does not belong to the specified exam subject");
      }
      if (exam.academicYearId !== input.academicYearId) {
        throw AppError.badRequest("Exam does not belong to the specified academic year");
      }
    },

    async validateMarks(input: CreateStudentMarkInput) {
      if (input.isAbsent) {
        if (input.marksObtained !== null && input.marksObtained !== undefined) {
          throw AppError.badRequest("Absent students cannot have marks entered");
        }
        return;
      }

      if (input.marksObtained !== null && input.marksObtained !== undefined) {
        const component = await prisma.examAssessmentComponent.findFirst({
          where: { id: input.assessmentCompId },
        });
        if (component && input.marksObtained > component.maxMarks) {
          throw AppError.badRequest(`Marks (${input.marksObtained}) cannot exceed max marks (${component.maxMarks})`);
        }
      }
    },
  };
}

export const studentMarkService = createStudentMarkService(studentMarkRepository);

export type StudentMarkService = typeof studentMarkService;
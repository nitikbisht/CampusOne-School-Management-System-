import { prisma } from "../../lib/prisma.js";
import type {
  CreateStudentMarkInput,
  UpdateStudentMarkInput,
  ListStudentMarksQuery,
  BulkStudentMarksInput,
} from "./student-mark.schemas.js";

export interface NewStudentMark extends CreateStudentMarkInput {
  schoolId: string;
  enteredById: string;
}

export interface UpdateStudentMark extends UpdateStudentMarkInput {}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const studentMarkRepository = {
  async list(schoolId: string, query: ListStudentMarksQuery) {
    const { page, limit, ...filters } = query;
    const where: Record<string, unknown> = { schoolId };

    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.examId) where.examId = filters.examId;
    if (filters.examSubjectId) where.examSubjectId = filters.examSubjectId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.isDraft !== undefined) where.isDraft = filters.isDraft;
    if (filters.isAbsent !== undefined) where.isAbsent = filters.isAbsent;

    // For classId/sectionId filtering, we need to join through student -> enrollment
    if (filters.classId || filters.sectionId) {
      where.student = {
        enrollments: {
          some: {
            academicYearId: filters.academicYearId || undefined,
            classId: filters.classId,
            sectionId: filters.sectionId,
            isActive: true,
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.studentMark.findMany({
        where,
        include: {
          student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } },
          exam: { select: { id: true, name: true, code: true } },
          examSubject: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
              class: { select: { id: true, name: true } },
            },
          },
          assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.studentMark.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(schoolId: string, id: string) {
    return prisma.studentMark.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } },
        exam: { select: { id: true, name: true, code: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true, weightage: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  },

  async create(schoolId: string, data: NewStudentMark) {
    const { schoolId: _, ...restData } = data;
    return prisma.studentMark.create({
      data: { schoolId, ...restData },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        exam: { select: { id: true, name: true, code: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true } },
      },
    });
  },

  async upsert(schoolId: string, data: NewStudentMark) {
    const { schoolId: _, ...restData } = data;
    return prisma.studentMark.upsert({
      where: {
        studentId_examSubjectId_assessmentCompId: {
          studentId: data.studentId,
          examSubjectId: data.examSubjectId,
          assessmentCompId: data.assessmentCompId,
        },
      },
      create: { schoolId, ...restData },
      update: {
        marksObtained: data.marksObtained,
        isAbsent: data.isAbsent,
        isDraft: data.isDraft,
        enteredById: data.enteredById,
        academicYearId: data.academicYearId,
        examId: data.examId,
      },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        exam: { select: { id: true, name: true, code: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true } },
      },
    });
  },

  async update(schoolId: string, id: string, data: UpdateStudentMark) {
    return prisma.studentMark.update({
      where: { id, schoolId },
      data,
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        exam: { select: { id: true, name: true, code: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true } },
      },
    });
  },

  async delete(schoolId: string, id: string) {
    return prisma.studentMark.delete({ where: { id, schoolId } });
  },

  // Bulk operations
  async bulkUpsert(schoolId: string, input: BulkStudentMarksInput, enteredById: string, academicYearId: string, examId: string) {
    const results = await Promise.all(
      input.marks.map((mark) =>
        prisma.studentMark.upsert({
          where: {
            studentId_examSubjectId_assessmentCompId: {
              studentId: mark.studentId,
              examSubjectId: input.examSubjectId,
              assessmentCompId: mark.assessmentCompId,
            },
          },
          create: {
            schoolId,
            studentId: mark.studentId,
            academicYearId,
            examId,
            examSubjectId: input.examSubjectId,
            assessmentCompId: mark.assessmentCompId,
            marksObtained: mark.marksObtained ?? null,
            isAbsent: mark.isAbsent,
            isDraft: mark.isDraft,
            enteredById,
          },
          update: {
            marksObtained: mark.marksObtained ?? null,
            isAbsent: mark.isAbsent,
            isDraft: mark.isDraft,
            enteredById,
          },
        })
      )
    );
    return results;
  },

  // Query by exam subject with full details for mark sheet
  async getByExamSubject(schoolId: string, examSubjectId: string) {
    // Get the exam subject to get academicYearId, examId
    const examSubject = await prisma.examSubject.findFirst({
      where: { id: examSubjectId, schoolId },
      include: {
        exam: { select: { id: true, academicYearId: true } },
        components: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    if (!examSubject) return null;

    // Get enrolled students for this class/section in this academic year
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        academicYearId: examSubject.exam.academicYearId,
        classId: examSubject.classId,
        isActive: true,
      },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ section: { name: "asc" } }, { student: { admissionNo: "asc" } }],
    });

    // Get all marks for this exam subject
    const marks = await prisma.studentMark.findMany({
      where: { schoolId, examSubjectId },
      include: {
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true, weightage: true, displayOrder: true } },
      },
    });

    // Build mark sheet: student x component matrix
    const marksByStudent = new Map<string, Map<string, typeof marks[0]>>();
    for (const mark of marks) {
      if (!marksByStudent.has(mark.studentId)) {
        marksByStudent.set(mark.studentId, new Map());
      }
      marksByStudent.get(mark.studentId)!.set(mark.assessmentCompId, mark);
    }

    return {
      examSubject,
      components: examSubject.components,
      students: enrollments.map((e) => ({
        student: e.student,
        section: e.section,
        rollNumber: e.rollNumber,
        marks: examSubject.components.map((comp) => marksByStudent.get(e.student.id)?.get(comp.id) ?? null),
      })),
    };
  },

  // Get marks for a specific student
  async getByStudent(schoolId: string, studentId: string, academicYearId?: string) {
    const where: Record<string, unknown> = { schoolId, studentId };
    if (academicYearId) where.academicYearId = academicYearId;

    return prisma.studentMark.findMany({
      where,
      include: {
        exam: { select: { id: true, name: true, code: true, startDate: true, endDate: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true, type: true, weightage: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ exam: { startDate: "asc" } }, { examSubject: { subject: { name: "asc" } } }, { assessmentComp: { displayOrder: "asc" } }],
    });
  },

  // Get consolidated marks for a class/section/exam
  async getConsolidated(schoolId: string, examId: string, classId: string, sectionId: string) {
    const exam = await prisma.exam.findFirst({ where: { id: examId } });
    const academicYearId = exam?.academicYearId!;
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { academicYearId, classId, sectionId, isActive: true },
      include: { student: { select: { id: true, admissionNo: true, firstName: true, middleName: true, lastName: true } } },
      orderBy: { student: { admissionNo: "asc" } },
    });

    const examSubjects = await prisma.examSubject.findMany({
      where: { examId, classId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        components: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
      },
    });

    const marks = await prisma.studentMark.findMany({
      where: { schoolId, examId, studentId: { in: enrollments.map((e) => e.studentId) } },
      include: { assessmentComp: { select: { id: true, name: true, code: true, maxMarks: true, passMarks: true } } },
    });

    const marksByStudentComp = new Map<string, Map<string, typeof marks[0]>>();
    for (const mark of marks) {
      const key = `${mark.studentId}-${mark.examSubjectId}`;
      if (!marksByStudentComp.has(key)) marksByStudentComp.set(key, new Map());
      marksByStudentComp.get(key)!.set(mark.assessmentCompId, mark);
    }

    return {
      enrollments,
      examSubjects,
      marks: marksByStudentComp,
    };
  },

  // Validation - check which students have marks entered
  async getValidationStatus(schoolId: string, examSubjectId: string) {
    const examSubject = await prisma.examSubject.findFirst({
      where: { id: examSubjectId, schoolId },
      include: {
        exam: { select: { academicYearId: true } },
        class: { select: { id: true } },
        components: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!examSubject) throw new Error("Exam subject not found");

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { academicYearId: examSubject.exam.academicYearId, classId: examSubject.classId, isActive: true },
      select: { studentId: true },
    });

    const marks = await prisma.studentMark.findMany({
      where: { schoolId, examSubjectId, studentId: { in: enrollments.map((e) => e.studentId) } },
      select: { studentId: true, assessmentCompId: true, isDraft: true },
    });

    const enteredByStudent = new Map<string, Set<string>>();
    for (const mark of marks) {
      if (!enteredByStudent.has(mark.studentId)) enteredByStudent.set(mark.studentId, new Set());
      enteredByStudent.get(mark.studentId)!.add(mark.assessmentCompId);
    }

    return {
      examSubjectId,
      totalStudents: enrollments.length,
      totalComponents: examSubject.components.length,
      students: enrollments.map((e) => ({
        studentId: e.studentId,
        enteredComponents: enteredByStudent.get(e.studentId)?.size ?? 0,
        isComplete: enteredByStudent.get(e.studentId)?.size === examSubject.components.length,
        isPublished: enteredByStudent.get(e.studentId)?.size === examSubject.components.length
          && marks.filter((m) => m.studentId === e.studentId).every((m) => !m.isDraft),
      })),
    };
  },
};

export type StudentMarkRepository = typeof studentMarkRepository;
import { prisma } from "../../lib/prisma.js";
import type {
  ListExamsQuery,
  CreateExamInput,
  UpdateExamInput,
  ListExamSubjectsQuery,
  CreateExamSubjectInput,
  UpdateExamSubjectInput,
  ListExamAssessmentComponentsQuery,
  CreateExamAssessmentComponentInput,
  UpdateExamAssessmentComponentInput,
  ListExamSchedulesQuery,
  CreateExamScheduleInput,
  UpdateExamScheduleInput,
} from "./exam.schemas.js";

/** Data access layer: pure Prisma calls, scoped by schoolId. */

export const examRepository = {
  // Exam methods
  async list(schoolId: string, query: ListExamsQuery) {
    const { page, limit, ...filters } = query;
    const where: Record<string, unknown> = { schoolId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          academicYear: { select: { id: true, name: true } },
          _count: { select: { subjects: true, schedules: true } },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exam.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(schoolId: string, id: string) {
    return prisma.exam.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: { select: { id: true, name: true } },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            components: true,
          },
        },
        schedules: {
          include: {
            examSubject: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
                class: { select: { id: true, name: true } },
              },
            },
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            room: { select: { id: true, name: true, code: true } },
            invigilator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  },

  async create(schoolId: string, input: CreateExamInput) {
    return prisma.exam.create({
      data: { ...input, schoolId },
      include: { academicYear: { select: { id: true, name: true } } },
    });
  },

  async update(schoolId: string, id: string, input: UpdateExamInput) {
    return prisma.exam.update({
      where: { id, schoolId },
      data: input,
      include: { academicYear: { select: { id: true, name: true } } },
    });
  },

  async delete(schoolId: string, id: string) {
    return prisma.exam.delete({ where: { id, schoolId } });
  },

  // ExamSubject methods
  async listSubjects(schoolId: string, query: ListExamSubjectsQuery) {
    const { page, limit, ...filters } = query;
    const where: Record<string, unknown> = { schoolId };
    if (filters.examId) where.examId = filters.examId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [items, total] = await Promise.all([
      prisma.examSubject.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          components: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.examSubject.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findSubjectById(schoolId: string, id: string) {
    return prisma.examSubject.findFirst({
      where: { id, schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        components: true,
      },
    });
  },

  async createSubject(schoolId: string, input: CreateExamSubjectInput) {
    return prisma.examSubject.create({
      data: { ...input, schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    });
  },

  async updateSubject(schoolId: string, id: string, input: UpdateExamSubjectInput) {
    return prisma.examSubject.update({
      where: { id, schoolId },
      data: input,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    });
  },

  async deleteSubject(schoolId: string, id: string) {
    return prisma.examSubject.delete({ where: { id, schoolId } });
  },

  // ExamAssessmentComponent methods
  async listComponents(schoolId: string, query: ListExamAssessmentComponentsQuery) {
    const { page, limit, ...filters } = query;
    const where: Record<string, unknown> = { schoolId };
    if (filters.examSubjectId) where.examSubjectId = filters.examSubjectId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [items, total] = await Promise.all([
      prisma.examAssessmentComponent.findMany({
        where,
        include: {
          examSubject: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.examAssessmentComponent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findComponentById(schoolId: string, id: string) {
    return prisma.examAssessmentComponent.findFirst({
      where: { id, schoolId },
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async createComponent(schoolId: string, input: CreateExamAssessmentComponentInput) {
    return prisma.examAssessmentComponent.create({
      data: { ...input, schoolId },
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async updateComponent(schoolId: string, id: string, input: UpdateExamAssessmentComponentInput) {
    return prisma.examAssessmentComponent.update({
      where: { id, schoolId },
      data: input,
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async deleteComponent(schoolId: string, id: string) {
    return prisma.examAssessmentComponent.delete({ where: { id, schoolId } });
  },

  // ExamSchedule methods
  async listSchedules(schoolId: string, query: ListExamSchedulesQuery) {
    const { page, limit, ...filters } = query;
    const where: Record<string, unknown> = { schoolId };
    if (filters.examId) where.examId = filters.examId;
    if (filters.examSubjectId) where.examSubjectId = filters.examSubjectId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.date) where.date = new Date(filters.date);

    const [items, total] = await Promise.all([
      prisma.examSchedule.findMany({
        where,
        include: {
          examSubject: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
              class: { select: { id: true, name: true } },
            },
          },
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          room: { select: { id: true, name: true, code: true } },
          invigilator: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.examSchedule.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findScheduleById(schoolId: string, id: string) {
    return prisma.examSchedule.findFirst({
      where: { id, schoolId },
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, code: true } },
        invigilator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async createSchedule(schoolId: string, input: CreateExamScheduleInput) {
    return prisma.examSchedule.create({
      data: { ...input, schoolId },
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, code: true } },
        invigilator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async updateSchedule(schoolId: string, id: string, input: UpdateExamScheduleInput) {
    return prisma.examSchedule.update({
      where: { id, schoolId },
      data: input,
      include: {
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, code: true } },
        invigilator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async deleteSchedule(schoolId: string, id: string) {
    return prisma.examSchedule.delete({ where: { id, schoolId } });
  },
};
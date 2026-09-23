import { examRepository } from "./exam.repository.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateExamInput,
  UpdateExamInput,
  ListExamsQuery,
  CreateExamSubjectInput,
  UpdateExamSubjectInput,
  ListExamSubjectsQuery,
  CreateExamAssessmentComponentInput,
  UpdateExamAssessmentComponentInput,
  ListExamAssessmentComponentsQuery,
  CreateExamScheduleInput,
  UpdateExamScheduleInput,
  ListExamSchedulesQuery,
} from "./exam.schemas.js";

/** Business logic layer: validation, orchestration, cross-repo calls. */

function assertExamInput(input: CreateExamInput, schoolId: string) {
  if (!input.academicYearId) throw new Error("academicYearId is required");
  if (!input.name) throw new Error("name is required");
  if (!input.code) throw new Error("code is required");
  if (!input.startDate) throw new Error("startDate is required");
  if (!input.endDate) throw new Error("endDate is required");
  if (new Date(input.endDate) < new Date(input.startDate)) {
    throw new Error("endDate must be after or equal to startDate");
  }
}

function assertExamUpdateInput(input: UpdateExamInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
  if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
    throw new Error("endDate must be after or equal to startDate");
  }
}

function assertExamSubjectInput(input: CreateExamSubjectInput, schoolId: string) {
  if (!input.examId) throw new Error("examId is required");
  if (!input.subjectId) throw new Error("subjectId is required");
  if (!input.classId) throw new Error("classId is required");
  if (input.maxMarks <= 0) throw new Error("maxMarks must be positive");
  if (input.passMarks < 0) throw new Error("passMarks cannot be negative");
  if (input.passMarks > input.maxMarks) throw new Error("passMarks cannot exceed maxMarks");
}

function assertExamSubjectUpdateInput(input: UpdateExamSubjectInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
  if (input.maxMarks !== undefined && input.maxMarks <= 0) throw new Error("maxMarks must be positive");
  if (input.passMarks !== undefined && input.passMarks < 0) throw new Error("passMarks cannot be negative");
}

function assertComponentInput(input: CreateExamAssessmentComponentInput, schoolId: string) {
  if (!input.examSubjectId) throw new Error("examSubjectId is required");
  if (!input.name) throw new Error("name is required");
  if (!input.code) throw new Error("code is required");
  if (input.maxMarks <= 0) throw new Error("maxMarks must be positive");
  if (input.passMarks < 0) throw new Error("passMarks cannot be negative");
  if (input.passMarks > input.maxMarks) throw new Error("passMarks cannot exceed maxMarks");
}

function assertComponentUpdateInput(input: UpdateExamAssessmentComponentInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
  if (input.maxMarks !== undefined && input.maxMarks <= 0) throw new Error("maxMarks must be positive");
  if (input.passMarks !== undefined && input.passMarks < 0) throw new Error("passMarks cannot be negative");
}

function assertScheduleInput(input: CreateExamScheduleInput, schoolId: string) {
  if (!input.examId) throw new Error("examId is required");
  if (!input.examSubjectId) throw new Error("examSubjectId is required");
  if (!input.classId) throw new Error("classId is required");
  if (!input.date) throw new Error("date is required");
  if (!input.startTime) throw new Error("startTime is required");
  if (!input.endTime) throw new Error("endTime is required");
  if (input.startTime >= input.endTime) throw new Error("endTime must be after startTime");
}

function assertScheduleUpdateInput(input: UpdateExamScheduleInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    throw new Error("endTime must be after startTime");
  }
}

export const examService = {
  // Exam methods
  async list(schoolId: string, query: ListExamsQuery) {
    const { page, limit, ...filters } = query;
    const items = await examRepository.list(schoolId, query);
    return items;
  },

  async getById(schoolId: string, id: string) {
    const exam = await examRepository.findById(schoolId, id);
    if (!exam) throw new Error("Exam not found");
    return exam;
  },

  async create(schoolId: string, input: CreateExamInput) {
    assertExamInput(input, schoolId);

    // Validate academic year exists in this school
    const academicYear = await prisma.academicYear.findFirst({
      where: { id: input.academicYearId, schoolId },
    });
    if (!academicYear) throw new Error("Academic year not found in this school");

    // Check for duplicate code in same academic year
    const existing = await prisma.exam.findFirst({
      where: { schoolId, academicYearId: input.academicYearId, code: input.code },
    });
    if (existing) throw new Error("Exam with this code already exists for this academic year");

    return examRepository.create(schoolId, input);
  },

  async update(schoolId: string, id: string, input: UpdateExamInput) {
    assertExamUpdateInput(input);

    const existing = await examRepository.findById(schoolId, id);
    if (!existing) throw new Error("Exam not found");

    // Validate academic year if being updated
    if (input.academicYearId) {
      const academicYear = await prisma.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId },
      });
      if (!academicYear) throw new Error("Academic year not found in this school");

      // Check for duplicate code
      const duplicate = await prisma.exam.findFirst({
        where: {
          schoolId,
          academicYearId: input.academicYearId,
          code: input.code ?? existing.code,
          id: { not: id },
        },
      });
      if (duplicate) throw new Error("Exam with this code already exists for this academic year");
    }

    return examRepository.update(schoolId, id, input);
  },

  async delete(schoolId: string, id: string) {
    const existing = await examRepository.findById(schoolId, id);
    if (!existing) throw new Error("Exam not found");
    return examRepository.delete(schoolId, id);
  },

  async publish(schoolId: string, id: string) {
    const existing = await examRepository.findById(schoolId, id);
    if (!existing) throw new Error("Exam not found");

    if (existing.status === "COMPLETED") throw new Error("Cannot publish a completed exam");

    return prisma.exam.update({
      where: { id, schoolId },
      data: { status: "SCHEDULED", isPublished: true, publishAt: new Date() },
      include: { academicYear: { select: { id: true, name: true } } },
    });
  },

  // ExamSubject methods
  async listSubjects(schoolId: string, query: ListExamSubjectsQuery) {
    return examRepository.listSubjects(schoolId, query);
  },

  async getSubjectById(schoolId: string, id: string) {
    const subject = await examRepository.findSubjectById(schoolId, id);
    if (!subject) throw new Error("Exam subject not found");
    return subject;
  },

  async createSubject(schoolId: string, input: CreateExamSubjectInput) {
    assertExamSubjectInput(input, schoolId);

    // Validate exam exists in this school
    const exam = await prisma.exam.findFirst({ where: { id: input.examId, schoolId } });
    if (!exam) throw new Error("Exam not found in this school");

    // Validate subject exists in this school
    const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
    if (!subject) throw new Error("Subject not found in this school");

    // Validate class exists in this school
    const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
    if (!classEntity) throw new Error("Class not found in this school");

    // Check for duplicate
    const existing = await prisma.examSubject.findFirst({
      where: { examId: input.examId, subjectId: input.subjectId, classId: input.classId },
    });
    if (existing) throw new Error("This subject is already added to this exam for this class");

    return examRepository.createSubject(schoolId, input);
  },

  async updateSubject(schoolId: string, id: string, input: UpdateExamSubjectInput) {
    assertExamSubjectUpdateInput(input);

    const existing = await examRepository.findSubjectById(schoolId, id);
    if (!existing) throw new Error("Exam subject not found");

    // Validate references if being updated
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
      if (!subject) throw new Error("Subject not found in this school");
    }
    if (input.classId) {
      const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
      if (!classEntity) throw new Error("Class not found in this school");
    }

    // Check for duplicate if subjectId/classId are being changed
    if (input.subjectId || input.classId) {
      const subjectId = input.subjectId ?? existing.subjectId;
      const classId = input.classId ?? existing.classId;
      const duplicate = await prisma.examSubject.findFirst({
        where: {
          examId: existing.examId,
          subjectId,
          classId,
          id: { not: id },
        },
      });
      if (duplicate) throw new Error("This subject is already added to this exam for this class");
    }

    return examRepository.updateSubject(schoolId, id, input);
  },

  async deleteSubject(schoolId: string, id: string) {
    const existing = await examRepository.findSubjectById(schoolId, id);
    if (!existing) throw new Error("Exam subject not found");
    return examRepository.deleteSubject(schoolId, id);
  },

  // ExamAssessmentComponent methods
  async listComponents(schoolId: string, query: ListExamAssessmentComponentsQuery) {
    return examRepository.listComponents(schoolId, query);
  },

  async getComponentById(schoolId: string, id: string) {
    const component = await examRepository.findComponentById(schoolId, id);
    if (!component) throw new Error("Exam assessment component not found");
    return component;
  },

  async createComponent(schoolId: string, input: CreateExamAssessmentComponentInput) {
    assertComponentInput(input, schoolId);

    // Validate examSubject exists in this school
    const examSubject = await prisma.examSubject.findFirst({
      where: { id: input.examSubjectId, schoolId },
      include: { exam: true },
    });
    if (!examSubject) throw new Error("Exam subject not found in this school");

    // Check for duplicate code
    const existing = await prisma.examAssessmentComponent.findFirst({
      where: { examSubjectId: input.examSubjectId, code: input.code },
    });
    if (existing) throw new Error("Assessment component with this code already exists for this exam subject");

    return examRepository.createComponent(schoolId, input);
  },

  async updateComponent(schoolId: string, id: string, input: UpdateExamAssessmentComponentInput) {
    assertComponentUpdateInput(input);

    const existing = await examRepository.findComponentById(schoolId, id);
    if (!existing) throw new Error("Exam assessment component not found");

    // Check for duplicate code if being updated
    if (input.code && input.code !== existing.code) {
      const duplicate = await prisma.examAssessmentComponent.findFirst({
        where: { examSubjectId: existing.examSubjectId, code: input.code, id: { not: id } },
      });
      if (duplicate) throw new Error("Assessment component with this code already exists for this exam subject");
    }

    return examRepository.updateComponent(schoolId, id, input);
  },

  async deleteComponent(schoolId: string, id: string) {
    const existing = await examRepository.findComponentById(schoolId, id);
    if (!existing) throw new Error("Exam assessment component not found");
    return examRepository.deleteComponent(schoolId, id);
  },

  // ExamSchedule methods
  async listSchedules(schoolId: string, query: ListExamSchedulesQuery) {
    return examRepository.listSchedules(schoolId, query);
  },

  async getScheduleById(schoolId: string, id: string) {
    const schedule = await examRepository.findScheduleById(schoolId, id);
    if (!schedule) throw new Error("Exam schedule not found");
    return schedule;
  },

  async createSchedule(schoolId: string, input: CreateExamScheduleInput) {
    assertScheduleInput(input, schoolId);

    // Validate exam exists in this school
    const exam = await prisma.exam.findFirst({ where: { id: input.examId, schoolId } });
    if (!exam) throw new Error("Exam not found in this school");

    // Validate examSubject exists and belongs to the exam
    const examSubject = await prisma.examSubject.findFirst({
      where: { id: input.examSubjectId, examId: input.examId, schoolId },
    });
    if (!examSubject) throw new Error("Exam subject not found in this exam");

    // Validate class exists in this school
    const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
    if (!classEntity) throw new Error("Class not found in this school");

    // Validate section if provided
    if (input.sectionId) {
      const section = await prisma.section.findFirst({
        where: { id: input.sectionId, schoolId, classId: input.classId },
      });
      if (!section) throw new Error("Section not found in this class");
    }

    // Validate room if provided
    if (input.roomId) {
      const room = await prisma.room.findFirst({ where: { id: input.roomId, schoolId } });
      if (!room) throw new Error("Room not found in this school");
    }

    // Validate invigilator if provided
    if (input.invigilatorId) {
      const invigilator = await prisma.user.findFirst({ where: { id: input.invigilatorId, schoolId } });
      if (!invigilator) throw new Error("Invigilator not found in this school");
    }

    // Check for schedule conflict (same exam, class, section, date, time)
    const conflict = await prisma.examSchedule.findFirst({
      where: {
        examId: input.examId,
        classId: input.classId,
        sectionId: input.sectionId ?? null,
        date: new Date(input.date),
        OR: [
          { startTime: { lt: input.endTime }, endTime: { gt: input.startTime } },
        ],
      },
    });
    if (conflict) throw new Error("Schedule conflict: Another exam is scheduled at this time for this class/section");

    return examRepository.createSchedule(schoolId, input);
  },

  async updateSchedule(schoolId: string, id: string, input: UpdateExamScheduleInput) {
    assertScheduleUpdateInput(input);

    const existing = await examRepository.findScheduleById(schoolId, id);
    if (!existing) throw new Error("Exam schedule not found");

    // Validate references if being updated
    if (input.examSubjectId) {
      const examSubject = await prisma.examSubject.findFirst({
        where: { id: input.examSubjectId, examId: existing.examId, schoolId },
      });
      if (!examSubject) throw new Error("Exam subject not found in this exam");
    }
    if (input.classId) {
      const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
      if (!classEntity) throw new Error("Class not found in this school");
    }
    if (input.sectionId !== undefined) {
      if (input.sectionId) {
        const section = await prisma.section.findFirst({
          where: { id: input.sectionId, schoolId, classId: input.classId ?? existing.classId },
        });
        if (!section) throw new Error("Section not found in this class");
      }
    }
    if (input.roomId !== undefined) {
      if (input.roomId) {
        const room = await prisma.room.findFirst({ where: { id: input.roomId, schoolId } });
        if (!room) throw new Error("Room not found in this school");
      }
    }
    if (input.invigilatorId !== undefined) {
      if (input.invigilatorId) {
        const invigilator = await prisma.user.findFirst({ where: { id: input.invigilatorId, schoolId } });
        if (!invigilator) throw new Error("Invigilator not found in this school");
      }
    }

    // Check for schedule conflict if time/date/class/section changed
    if (input.date || input.startTime || input.endTime || input.classId || input.sectionId !== undefined) {
      const date = input.date ?? existing.date.toISOString().split("T")[0];
      const startTime = input.startTime ?? existing.startTime;
      const endTime = input.endTime ?? existing.endTime;
      const classId = input.classId ?? existing.classId;
      const sectionId = input.sectionId !== undefined ? input.sectionId : existing.sectionId;

      const conflict = await prisma.examSchedule.findFirst({
        where: {
          examId: existing.examId,
          classId,
          sectionId: sectionId ?? null,
          date: new Date(date),
          id: { not: id },
          OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
        },
      });
      if (conflict) throw new Error("Schedule conflict: Another exam is scheduled at this time for this class/section");
    }

    return examRepository.updateSchedule(schoolId, id, input);
  },

  async deleteSchedule(schoolId: string, id: string) {
    const existing = await examRepository.findScheduleById(schoolId, id);
    if (!existing) throw new Error("Exam schedule not found");
    return examRepository.deleteSchedule(schoolId, id);
  },

  // Helper methods
  async getByAcademicYear(schoolId: string, academicYearId: string) {
    return prisma.exam.findMany({
      where: { schoolId, academicYearId },
      include: {
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
      orderBy: { startDate: "asc" },
    });
  },

  async getByClassSection(schoolId: string, classId: string, sectionId: string, academicYearId: string) {
    return prisma.examSchedule.findMany({
      where: { schoolId, classId, sectionId, exam: { academicYearId } },
      include: {
        exam: { select: { id: true, name: true, code: true, status: true } },
        examSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        room: { select: { id: true, name: true, code: true } },
        invigilator: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },
};

export type ExamService = typeof examService;
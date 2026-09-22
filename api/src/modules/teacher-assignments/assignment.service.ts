import { assignmentRepository } from "./assignment.repository.js";
import { eligibilityService } from "../teacher-eligibility/eligibility.service.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateAssignmentInput, UpdateAssignmentInput, ListAssignmentsQuery } from "./assignment.schemas.js";

/** Business logic layer: validation, orchestration, cross-repo calls. */

function assertAssignmentInput(input: CreateAssignmentInput, schoolId: string) {
  if (!input.teacherId) throw new Error("teacherId is required");
  if (!input.academicYearId) throw new Error("academicYearId is required");
  if (!input.subjectId) throw new Error("subjectId is required");
  if (!input.classId) throw new Error("classId is required");
  if (!input.sectionId) throw new Error("sectionId is required");
}

function assertUpdateInput(input: UpdateAssignmentInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
}

export const assignmentService = {
  async list(schoolId: string, query: ListAssignmentsQuery) {
    const { page, limit, ...filters } = query;
    const items = await assignmentRepository.list(schoolId, filters);
    return { items, total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) };
  },

  async getById(schoolId: string, id: string) {
    const assignment = await assignmentRepository.findById(schoolId, id);
    if (!assignment) throw new Error("Teacher assignment not found");
    return assignment;
  },

  async create(schoolId: string, input: CreateAssignmentInput) {
    assertAssignmentInput(input, schoolId);

    // Validate teacher exists and is a user in this school
    const teacher = await prisma.user.findFirst({ where: { id: input.teacherId, schoolId } });
    if (!teacher) throw new Error("Teacher not found in this school");

    // Validate academic year exists in this school
    const academicYear = await prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
    if (!academicYear) throw new Error("Academic year not found in this school");

    // Validate subject exists in this school
    const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
    if (!subject) throw new Error("Subject not found in this school");

    // Validate class exists in this school
    const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
    if (!classEntity) throw new Error("Class not found in this school");

    // Validate section exists in this school and belongs to the academic year
    const section = await prisma.section.findFirst({ where: { id: input.sectionId, schoolId, academicYearId: input.academicYearId } });
    if (!section) throw new Error("Section not found in this academic year");
    if (section.classId !== input.classId) throw new Error("Section does not belong to the specified class");

    // Check teacher eligibility for this subject/class
    const isEligible = await eligibilityService.checkEligibility(schoolId, input.teacherId, input.subjectId, input.classId);
    if (!isEligible) {
      throw new Error("Teacher is not eligible to teach this subject for this class");
    }

    // Check for primary teacher conflict
    if (input.isPrimary !== false) {
      const hasPrimary = await assignmentRepository.checkPrimaryConflict(
        schoolId, input.academicYearId, input.subjectId, input.classId, input.sectionId
      );
      if (hasPrimary) {
        throw new Error("A primary teacher is already assigned for this subject in this class/section");
      }
    }

    // Check for duplicate assignment (same teacher, subject, class, section, academic year)
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        schoolId,
        teacherId: input.teacherId,
        academicYearId: input.academicYearId,
        subjectId: input.subjectId,
        classId: input.classId,
        sectionId: input.sectionId,
      },
    });
    if (existing) throw new Error("Teacher is already assigned to this subject for this class/section in this academic year");

    return assignmentRepository.create(schoolId, input);
  },

  async update(schoolId: string, id: string, input: UpdateAssignmentInput) {
    assertUpdateInput(input);

    const existing = await assignmentRepository.findById(schoolId, id);
    if (!existing) throw new Error("Teacher assignment not found");

    // Validate references if being updated
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
      if (!subject) throw new Error("Subject not found in this school");
    }
    if (input.classId) {
      const classEntity = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
      if (!classEntity) throw new Error("Class not found in this school");
    }
    if (input.sectionId) {
      const section = await prisma.section.findFirst({ where: { id: input.sectionId, schoolId, academicYearId: existing.academicYearId } });
      if (!section) throw new Error("Section not found in this academic year");
      // If classId is also being updated, validate section belongs to that class
      const classId = input.classId ?? existing.classId;
      if (section.classId !== classId) throw new Error("Section does not belong to the specified class");
    }

    // Check teacher eligibility if subject/class are being changed
    if (input.subjectId || input.classId) {
      const subjectId = input.subjectId ?? existing.subjectId;
      const classId = input.classId ?? existing.classId;
      const isEligible = await eligibilityService.checkEligibility(schoolId, existing.teacherId, subjectId, classId);
      if (!isEligible) {
        throw new Error("Teacher is not eligible to teach this subject for this class");
      }
    }

    // Check for primary teacher conflict if isPrimary is being set to true
    if (input.isPrimary === true) {
      const subjectId = input.subjectId ?? existing.subjectId;
      const classId = input.classId ?? existing.classId;
      const sectionId = input.sectionId ?? existing.sectionId;
      const hasPrimary = await assignmentRepository.checkPrimaryConflict(
        schoolId, existing.academicYearId, subjectId, classId, sectionId, id
      );
      if (hasPrimary) {
        throw new Error("A primary teacher is already assigned for this subject in this class/section");
      }
    }

    return assignmentRepository.update(schoolId, id, input);
  },

  async delete(schoolId: string, id: string) {
    const existing = await assignmentRepository.findById(schoolId, id);
    if (!existing) throw new Error("Teacher assignment not found");
    return assignmentRepository.delete(schoolId, id);
  },

  /** Get assignments for a teacher in an academic year */
  async getByTeacherYear(schoolId: string, teacherId: string, academicYearId: string) {
    return assignmentRepository.getByTeacherYear(schoolId, teacherId, academicYearId);
  },

  /** Get assignments for a class/section in an academic year */
  async getByClassSectionYear(schoolId: string, classId: string, sectionId: string, academicYearId: string) {
    return assignmentRepository.getByClassSectionYear(schoolId, classId, sectionId, academicYearId);
  },
};

export type AssignmentService = typeof assignmentService;
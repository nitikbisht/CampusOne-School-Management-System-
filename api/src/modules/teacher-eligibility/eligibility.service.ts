import { eligibilityRepository } from "./eligibility.repository.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateEligibilityInput, UpdateEligibilityInput, ListEligibilitiesQuery } from "./eligibility.schemas.js";

/** Business logic layer: validation, orchestration, cross-repo calls. */

function assertEligibilityInput(input: CreateEligibilityInput, schoolId: string) {
  if (!input.teacherId) throw new Error("teacherId is required");
  if (!input.subjectId) throw new Error("subjectId is required");
  if (!input.classId) throw new Error("classId is required");
}

function assertUpdateInput(input: UpdateEligibilityInput) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field must be provided for update");
  }
}

export const eligibilityService = {
  async list(schoolId: string, query: ListEligibilitiesQuery) {
    const { page, limit, ...filters } = query;
    const items = await eligibilityRepository.list(schoolId, filters);
    // For pagination, we'd need to implement it in repository, but for now return all
    return { items, total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) };
  },

  async getById(schoolId: string, id: string) {
    const eligibility = await eligibilityRepository.findById(schoolId, id);
    if (!eligibility) throw new Error("Teacher eligibility not found");
    return eligibility;
  },

  async create(schoolId: string, input: CreateEligibilityInput) {
    assertEligibilityInput(input, schoolId);

    // Validate teacher exists and is a user in this school
    const teacher = await prisma.user.findFirst({ where: { id: input.teacherId, schoolId } });
    if (!teacher) throw new Error("Teacher not found in this school");

    // Validate subject exists in this school
    const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
    if (!subject) throw new Error("Subject not found in this school");

    // Validate class exists in this school
    const classMin = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
    if (!classMin) throw new Error("Class (min) not found in this school");

    // Validate maxClass if provided
    if (input.maxClassId) {
      const classMax = await prisma.schoolClass.findFirst({ where: { id: input.maxClassId, schoolId } });
      if (!classMax) throw new Error("Class (max) not found in this school");
      // Ensure max class displayOrder >= min class displayOrder
      if (classMax.displayOrder < classMin.displayOrder) {
        throw new Error("Max class must be same or higher than min class");
      }
    }

    // Check for duplicate
    const existing = await prisma.teacherEligibility.findFirst({
      where: {
        schoolId,
        teacherId: input.teacherId,
        subjectId: input.subjectId,
        classId: input.classId,
      },
    });
    if (existing) throw new Error("Eligibility already exists for this teacher, subject, and class range");

    return eligibilityRepository.create(schoolId, input);
  },

  async update(schoolId: string, id: string, input: UpdateEligibilityInput) {
    assertUpdateInput(input);

    const existing = await eligibilityRepository.findById(schoolId, id);
    if (!existing) throw new Error("Teacher eligibility not found");

    // Validate references if being updated
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
      if (!subject) throw new Error("Subject not found in this school");
    }
    if (input.classId) {
      const classMin = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
      if (!classMin) throw new Error("Class (min) not found in this school");
    }
    if (input.maxClassId !== undefined) {
      if (input.maxClassId) {
        const classMax = await prisma.schoolClass.findFirst({ where: { id: input.maxClassId, schoolId } });
        if (!classMax) throw new Error("Class (max) not found in this school");
        // Validate order if both classId and maxClassId are provided
        const minClassId = input.classId ?? existing.classId;
        const minClass = await prisma.schoolClass.findFirst({ where: { id: minClassId, schoolId } });
        if (minClass && classMax.displayOrder < minClass.displayOrder) {
          throw new Error("Max class must be same or higher than min class");
        }
      }
      // Allow setting maxClassId to null (single class)
    }

    // Check for duplicate if teacherId/subjectId/classId are being changed
    if (input.subjectId || input.classId) {
      const teacherId = existing.teacherId; // teacherId cannot be changed
      const subjectId = input.subjectId ?? existing.subjectId;
      const classId = input.classId ?? existing.classId;
      const duplicate = await prisma.teacherEligibility.findFirst({
        where: {
          schoolId,
          teacherId,
          subjectId,
          classId,
          id: { not: id },
        },
      });
      if (duplicate) throw new Error("Eligibility already exists for this teacher, subject, and class range");
    }

    return eligibilityRepository.update(schoolId, id, input);
  },

  async delete(schoolId: string, id: string) {
    const existing = await eligibilityRepository.findById(schoolId, id);
    if (!existing) throw new Error("Teacher eligibility not found");
    return eligibilityRepository.delete(schoolId, id);
  },

  /** Check if teacher is eligible for a subject/class combination */
  async checkEligibility(schoolId: string, teacherId: string, subjectId: string, classId: string): Promise<boolean> {
    return eligibilityRepository.checkEligibility(schoolId, teacherId, subjectId, classId);
  },

  /** Get all eligibilities for a teacher */
  async getByTeacher(schoolId: string, teacherId: string) {
    return eligibilityRepository.getByTeacher(schoolId, teacherId);
  },
};

export type EligibilityService = typeof eligibilityService;
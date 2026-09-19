import { AppError } from "../../lib/errors.js";
import type { CreateEnrollmentInput, UpdateEnrollmentInput } from "./enrollment.schemas.js";
import { enrollmentRepository, type EnrollmentRepository } from "./enrollment.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createEnrollmentService(repo: EnrollmentRepository) {
  return {
    async list(schoolId: string, options: { academicYearId?: string; classId?: string; sectionId?: string; studentId?: string; isActive?: boolean; page: number; limit: number }) {
      return repo.list({ schoolId, ...options });
    },

    async get(schoolId: string, id: string) {
      const enrollment = await repo.findById(schoolId, id);
      if (!enrollment) throw AppError.notFound("Enrollment not found");
      return enrollment;
    },

    async create(schoolId: string, input: CreateEnrollmentInput) {
      // Verify student exists and belongs to school
      const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) throw AppError.notFound("Student not found");

      // Verify academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) throw AppError.notFound("Academic year not found");

      // Verify class exists and belongs to school
      const cls = await prisma.schoolClass.findFirst({ where: { id: input.classId, schoolId } });
      if (!cls) throw AppError.notFound("Class not found");

      // Verify section exists and belongs to school and academic year
      const section = await prisma.section.findFirst({
        where: { id: input.sectionId, schoolId, academicYearId: input.academicYearId, classId: input.classId },
      });
      if (!section) throw AppError.notFound("Section not found or does not match class/academic year");

      // Check if student already enrolled in this academic year
      const existingEnrollment = await repo.findByStudentAndYear(schoolId, input.studentId, input.academicYearId);
      if (existingEnrollment) {
        throw AppError.conflict("Student is already enrolled in this academic year");
      }

      // Check roll number uniqueness if provided
      if (input.rollNumber) {
        const existingRoll = await repo.findByClassSectionRoll(
          schoolId,
          input.academicYearId,
          input.classId,
          input.sectionId,
          input.rollNumber
        );
        if (existingRoll) {
          throw AppError.conflict("Roll number already assigned in this section");
        }
      }

      return repo.create(schoolId, {
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        classId: input.classId,
        sectionId: input.sectionId,
        rollNumber: input.rollNumber,
        isActive: true,
      });
    },

    async update(schoolId: string, id: string, input: UpdateEnrollmentInput) {
      const enrollment = await repo.findById(schoolId, id);
      if (!enrollment) throw AppError.notFound("Enrollment not found");

      // If changing class/section, verify they exist and match
      if (input.classId || input.sectionId) {
        const newClassId = input.classId ?? enrollment.classId;
        const newSectionId = input.sectionId ?? enrollment.sectionId;

        const section = await prisma.section.findFirst({
          where: { id: newSectionId, schoolId, academicYearId: enrollment.academicYearId, classId: newClassId },
        });
        if (!section) throw AppError.notFound("Section not found or does not match class/academic year");
      }

      // Check roll number uniqueness if being updated
      if (input.rollNumber) {
        const existingRoll = await repo.findByClassSectionRoll(
          schoolId,
          enrollment.academicYearId,
          input.classId ?? enrollment.classId,
          input.sectionId ?? enrollment.sectionId,
          input.rollNumber
        );
        if (existingRoll && existingRoll.id !== id) {
          throw AppError.conflict("Roll number already assigned in this section");
        }
      }

      return repo.update(schoolId, id, input);
    },

    async delete(schoolId: string, id: string) {
      const enrollment = await repo.findById(schoolId, id);
      if (!enrollment) throw AppError.notFound("Enrollment not found");

      // Check for related records
      const [attendanceCount, leaveCount, markCount, assignmentCount] = await Promise.all([
        prisma.attendance.count({ where: { studentId: enrollment.studentId, academicYearId: enrollment.academicYearId, classId: enrollment.classId, sectionId: enrollment.sectionId } }),
        prisma.leaveRequest.count({ where: { studentId: enrollment.studentId, academicYearId: enrollment.academicYearId, classId: enrollment.classId, sectionId: enrollment.sectionId } }),
        prisma.studentMark.count({ where: { studentId: enrollment.studentId, academicYearId: enrollment.academicYearId } }),
        prisma.assignmentSubmission.count({ where: { studentId: enrollment.studentId } }),
      ]);

      if (attendanceCount > 0 || leaveCount > 0 || markCount > 0 || assignmentCount > 0) {
        throw AppError.conflict("Cannot delete enrollment with associated records (attendance, leaves, marks, assignments)");
      }

      return repo.delete(schoolId, id);
    },
  };
}

export const enrollmentService = createEnrollmentService(enrollmentRepository);
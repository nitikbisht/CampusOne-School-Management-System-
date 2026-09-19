import { AppError } from "../../lib/errors.js";
import type { CreateStudentInput, UpdateStudentInput } from "./student.schemas.js";
import { studentRepository, type StudentRepository } from "./student.repository.js";
import { prisma } from "../../lib/prisma.js";

/** Business rules live here. The repository is injected so the service is easy to unit-test. */
export function createStudentService(repo: StudentRepository) {
  return {
    async list(schoolId: string, options: { status?: string; search?: string; page: number; limit: number }) {
      return repo.list({ schoolId, ...options });
    },

    async get(schoolId: string, id: string) {
      const student = await repo.findById(schoolId, id);
      if (!student) throw AppError.notFound("Student not found");
      return student;
    },

    async create(schoolId: string, input: CreateStudentInput) {
      // Check for duplicate admission number
      const existing = await repo.findByAdmissionNo(schoolId, input.admissionNo);
      if (existing) {
        throw AppError.conflict("Student with this admission number already exists");
      }
      return repo.create(schoolId, {
        admissionNo: input.admissionNo,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        bloodGroup: input.bloodGroup,
        religion: input.religion,
        category: input.category,
        nationality: input.nationality,
        motherTongue: input.motherTongue,
        aadharNumber: input.aadharNumber,
        photoUrl: input.photoUrl,
        admissionDate: new Date(input.admissionDate),
        status: "ACTIVE",
      });
    },

    async update(schoolId: string, id: string, input: UpdateStudentInput) {
      const student = await repo.findById(schoolId, id);
      if (!student) throw AppError.notFound("Student not found");

      // Check for duplicate admission number if being updated
      if (input.admissionNo && input.admissionNo !== student.admissionNo) {
        const existing = await repo.findByAdmissionNo(schoolId, input.admissionNo);
        if (existing) {
          throw AppError.conflict("Student with this admission number already exists");
        }
      }

      const updateData: Record<string, unknown> = { ...input };
      if (input.dateOfBirth) updateData.dateOfBirth = new Date(input.dateOfBirth);
      if (input.admissionDate) updateData.admissionDate = new Date(input.admissionDate);

      return repo.update(schoolId, id, updateData);
    },

    async delete(schoolId: string, id: string) {
      const student = await repo.findById(schoolId, id);
      if (!student) throw AppError.notFound("Student not found");

      // Check if student has enrollments, attendances, leaves, marks, etc.
      const [
        enrollmentCount,
        attendanceCount,
        leaveCount,
        markCount,
        assignmentCount,
        certificateCount,
        parentCount,
      ] = await Promise.all([
        prisma.studentEnrollment.count({ where: { studentId: id } }),
        prisma.attendance.count({ where: { studentId: id } }),
        prisma.leaveRequest.count({ where: { studentId: id } }),
        prisma.studentMark.count({ where: { studentId: id } }),
        prisma.assignmentSubmission.count({ where: { studentId: id } }),
        prisma.certificate.count({ where: { studentId: id } }),
        prisma.parentStudent.count({ where: { studentId: id } }),
      ]);

      if (enrollmentCount > 0 || attendanceCount > 0 || leaveCount > 0 || markCount > 0 || assignmentCount > 0 || certificateCount > 0 || parentCount > 0) {
        throw AppError.conflict("Cannot delete student with associated records (enrollments, attendances, leaves, marks, assignments, certificates, or parent links)");
      }

      return repo.delete(schoolId, id);
    },
  };
}

export const studentService = createStudentService(studentRepository);
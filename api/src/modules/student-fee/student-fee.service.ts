import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { studentFeeRepository } from "./student-fee.repository.js";
import type { CreateStudentFeeInput, BulkAssignStudentFeeInput, UpdateStudentFeeInput, ListStudentFeesQuery } from "./student-fee.schemas.js";

const studentFeeService = (() => {
  const repo = studentFeeRepository;

  async function recalculateAmounts(studentFeeId: string) {
    const studentFee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: { fee: true, payments: { where: { status: "COMPLETED" } } },
    });
    if (!studentFee) return;

    const paidAmount = studentFee.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(studentFee.fee.amount) - Number(studentFee.discountAmount || 0);
    const balanceAmount = totalAmount - paidAmount;

    let status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED" | "CANCELLED" = "PENDING";
    if (paidAmount >= totalAmount) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    } else if (studentFee.dueDate && new Date(studentFee.dueDate) < new Date()) {
      status = "OVERDUE";
    }

    await prisma.studentFee.update({
      where: { id: studentFeeId },
      data: { paidAmount, balanceAmount, status },
    });
  }

  return {
    async createStudentFee(schoolId: string, input: CreateStudentFeeInput) {
      // Verify student exists and belongs to school
      const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) throw AppError.notFound("Student not found");

      // Verify fee exists and belongs to school
      const fee = await prisma.fee.findFirst({ where: { id: input.feeId, schoolId } });
      if (!fee) throw AppError.notFound("Fee not found");

      // Verify academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) throw AppError.notFound("Academic year not found");

      // Check if student already has this fee for this academic year
      const existing = await repo.findByStudentAndFeeAndYear(input.studentId, input.feeId, input.academicYearId);
      if (existing) {
        throw AppError.conflict("Student already has this fee assigned for the selected academic year");
      }

      const totalAmount = Number(fee.amount) - (input.discountAmount || 0);

      return repo.create({
        school: { connect: { id: schoolId } },
        student: { connect: { id: input.studentId } },
        fee: { connect: { id: input.feeId } },
        academicYear: { connect: { id: input.academicYearId } },
        discountAmount: input.discountAmount || 0,
        discountReason: input.discountReason,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: input.status,
      });
    },

    async bulkAssignStudentFees(schoolId: string, input: BulkAssignStudentFeeInput) {
      // Verify fee exists and belongs to school
      const fee = await prisma.fee.findFirst({ where: { id: input.feeId, schoolId } });
      if (!fee) throw AppError.notFound("Fee not found");

      // Verify academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) throw AppError.notFound("Academic year not found");

      // Verify all students exist and belong to school
      const students = await prisma.student.findMany({
        where: { id: { in: input.studentIds }, schoolId },
        select: { id: true },
      });
      if (students.length !== input.studentIds.length) {
        throw AppError.notFound("One or more students not found");
      }

      // Check which students already have this fee
      const existingFees = await prisma.studentFee.findMany({
        where: {
          schoolId,
          feeId: input.feeId,
          academicYearId: input.academicYearId,
          studentId: { in: input.studentIds },
        },
        select: { studentId: true },
      });
      const existingStudentIds = new Set(existingFees.map((sf) => sf.studentId));
      const newStudentIds = input.studentIds.filter((id) => !existingStudentIds.has(id));

      if (newStudentIds.length === 0) {
        throw AppError.conflict("All selected students already have this fee assigned for the academic year");
      }

      const totalAmount = Number(fee.amount) - (input.discountAmount || 0);

      const createData = newStudentIds.map((studentId) => ({
        schoolId,
        studentId,
        feeId: input.feeId,
        academicYearId: input.academicYearId,
        discountAmount: input.discountAmount || 0,
        discountReason: input.discountReason,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: "PENDING" as const,
      }));

      await repo.createMany(createData);

      return { assigned: newStudentIds.length, skipped: existingStudentIds.size };
    },

    async getStudentFee(schoolId: string, id: string) {
      const studentFee = await repo.findById(id);
      if (!studentFee || studentFee.schoolId !== schoolId) {
        throw AppError.notFound("Student fee not found");
      }
      return studentFee;
    },

    async listStudentFees(schoolId: string, query: ListStudentFeesQuery) {
      return repo.findMany(schoolId, query);
    },

    async listStudentFeesByStudent(schoolId: string, studentId: string, academicYearId?: string) {
      return repo.findByStudent(schoolId, studentId, academicYearId);
    },

    async getStudentFeeSummary(schoolId: string, studentId: string, academicYearId: string) {
      return repo.getSummary(schoolId, studentId, academicYearId);
    },

    async updateStudentFee(schoolId: string, id: string, input: UpdateStudentFeeInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Student fee not found");
      }

      // Get the fee to access amount
      const fee = await prisma.fee.findUnique({ where: { id: existing.feeId } });
      if (!fee) throw AppError.notFound("Associated fee not found");

      // If discount amount is being updated, recalculate totals
      if (input.discountAmount !== undefined && input.discountAmount !== Number(existing.discountAmount)) {
        const totalAmount = Number(fee.amount) - input.discountAmount;
        const paidAmount = Number(existing.paidAmount);
        const balanceAmount = totalAmount - paidAmount;

        let status = input.status || existing.status;
        if (status === "PENDING" || status === "PARTIAL" || status === "OVERDUE") {
          if (paidAmount >= totalAmount) {
            status = "PAID";
          } else if (paidAmount > 0) {
            status = "PARTIAL";
          } else if (existing.dueDate && new Date(existing.dueDate) < new Date()) {
            status = "OVERDUE";
          }
        }

        const updated = await repo.update(id, {
          discountAmount: input.discountAmount,
          discountReason: input.discountReason ?? existing.discountReason,
          dueDate: input.dueDate ? new Date(input.dueDate) : (input.dueDate === null ? null : undefined),
          status,
          totalAmount,
          balanceAmount,
        });
        return updated;
      }

      return repo.update(id, {
        discountReason: input.discountReason ?? existing.discountReason,
        dueDate: input.dueDate ? new Date(input.dueDate) : (input.dueDate === null ? null : undefined),
        status: input.status,
      });
    },

    async deleteStudentFee(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Student fee not found");
      }

      // Check if any payments exist
      const paymentsCount = await prisma.payment.count({ where: { studentFeeId: id } });
      if (paymentsCount > 0) {
        throw AppError.conflict("Cannot delete student fee with existing payments");
      }

      return repo.delete(id);
    },

    // Internal method to recalculate after payment
    async recalculateAfterPayment(studentFeeId: string) {
      await recalculateAmounts(studentFeeId);
    },
  };
})();

export { studentFeeService };
export type StudentFeeService = typeof studentFeeService;
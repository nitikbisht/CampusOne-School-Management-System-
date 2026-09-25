import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { paymentRepository } from "./payment.repository.js";
import type { CreatePaymentInput, UpdatePaymentInput, ListPaymentsQuery } from "./payment.schemas.js";
import { studentFeeService } from "../student-fee/student-fee.service.js";

const paymentService = (() => {
  const repo = paymentRepository;

  return {
    async createPayment(schoolId: string, userId: string, input: CreatePaymentInput) {
      // Verify student exists and belongs to school
      const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) throw AppError.notFound("Student not found");

      // Verify student fee exists and belongs to school
      const studentFee = await prisma.studentFee.findFirst({ where: { id: input.studentFeeId, schoolId } });
      if (!studentFee) throw AppError.notFound("Student fee not found");

      // Verify student fee belongs to the student
      if (studentFee.studentId !== input.studentId) {
        throw AppError.badRequest("Student fee does not belong to the specified student");
      }

      // Verify academic year exists and belongs to school
      const academicYear = await prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) throw AppError.notFound("Academic year not found");

      // Verify collected by user exists
      const collectedBy = await prisma.user.findFirst({ where: { id: userId, schoolId } });
      if (!collectedBy) throw AppError.notFound("Collecting user not found");

      // Check if payment amount exceeds balance
      const balance = Number(studentFee.balanceAmount);
      if (input.amount > balance + 0.01) { // Allow small floating point tolerance
        throw AppError.badRequest(`Payment amount (${input.amount}) exceeds outstanding balance (${balance})`);
      }

      // Generate receipt number
      const receiptNumber = await repo.generateReceiptNumber(schoolId);

      // Create payment
      const payment = await repo.create({
        school: { connect: { id: schoolId } },
        student: { connect: { id: input.studentId } },
        studentFee: { connect: { id: input.studentFeeId } },
        academicYear: { connect: { id: input.academicYearId } },
        amount: input.amount,
        paymentDate: new Date(input.paymentDate),
        paymentMode: input.paymentMode,
        transactionRef: input.transactionRef,
        receiptNumber,
        notes: input.notes,
        status: input.status,
        collectedBy: { connect: { id: userId } },
      });

      // Update student fee balance and status
      await studentFeeService.recalculateAfterPayment(input.studentFeeId);

      // Auto-generate receipt if payment is completed
      if (input.status === "COMPLETED") {
        await prisma.receipt.create({
          data: {
            school: { connect: { id: schoolId } },
            payment: { connect: { id: payment.id } },
            student: { connect: { id: input.studentId } },
            academicYear: { connect: { id: input.academicYearId } },
            receiptNumber,
            receiptDate: new Date(input.paymentDate),
            amount: input.amount,
            generatedBy: { connect: { id: userId } },
          },
        });
      }

      return payment;
    },

    async getPayment(schoolId: string, id: string) {
      const payment = await repo.findById(id);
      if (!payment || payment.schoolId !== schoolId) {
        throw AppError.notFound("Payment not found");
      }
      return payment;
    },

    async listPayments(schoolId: string, query: ListPaymentsQuery) {
      return repo.findMany(schoolId, query);
    },

    async listPaymentsByStudent(schoolId: string, studentId: string, academicYearId?: string) {
      return repo.findByStudent(schoolId, studentId, academicYearId);
    },

    async updatePayment(schoolId: string, id: string, input: UpdatePaymentInput) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Payment not found");
      }

      // If status is being changed to REFUNDED/CANCELLED, we need to recalculate student fee
      const oldStatus = existing.status;
      const newStatus = input.status || existing.status;

      const updated = await repo.update(id, {
        notes: input.notes ?? existing.notes,
        status: newStatus,
        transactionRef: input.transactionRef ?? existing.transactionRef,
      });

      // Recalculate student fee if status changed to/from COMPLETED
      if ((oldStatus === "COMPLETED" && newStatus !== "COMPLETED") || (oldStatus !== "COMPLETED" && newStatus === "COMPLETED")) {
        await studentFeeService.recalculateAfterPayment(existing.studentFeeId);
      }

      return updated;
    },

    async deletePayment(schoolId: string, id: string) {
      const existing = await repo.findById(id);
      if (!existing || existing.schoolId !== schoolId) {
        throw AppError.notFound("Payment not found");
      }

      // Check if receipt exists
      const receipt = await prisma.receipt.findUnique({ where: { paymentId: id } });
      if (receipt) {
        throw AppError.conflict("Cannot delete payment with existing receipt. Delete receipt first.");
      }

      const studentFeeId = existing.studentFeeId;
      const wasCompleted = existing.status === "COMPLETED";

      await repo.delete(id);

      // Recalculate student fee if payment was completed
      if (wasCompleted) {
        await studentFeeService.recalculateAfterPayment(studentFeeId);
      }

      return { message: "Payment deleted successfully" };
    },
  };
})();

export { paymentService };
export type PaymentService = typeof paymentService;
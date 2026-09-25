import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { receiptRepository } from "./receipt.repository.js";
import type { ListReceiptsQuery } from "./receipt.schemas.js";

const receiptService = (() => {
  const repo = receiptRepository;

  return {
    async getReceipt(schoolId: string, id: string) {
      const receipt = await repo.findById(id);
      if (!receipt || receipt.schoolId !== schoolId) {
        throw AppError.notFound("Receipt not found");
      }
      return receipt;
    },

    async getReceiptByPayment(schoolId: string, paymentId: string) {
      const receipt = await repo.findByPaymentId(paymentId);
      if (!receipt || receipt.schoolId !== schoolId) {
        throw AppError.notFound("Receipt not found for this payment");
      }
      return receipt;
    },

    async listReceipts(schoolId: string, query: ListReceiptsQuery) {
      return repo.findMany(schoolId, query);
    },

    async generateReceipt(schoolId: string, userId: string, paymentId: string) {
      // Verify payment exists and belongs to school
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, schoolId },
        include: { student: true, studentFee: { include: { fee: true } }, academicYear: true },
      });
      if (!payment) throw AppError.notFound("Payment not found");

      // Check if receipt already exists
      const existingReceipt = await prisma.receipt.findUnique({ where: { paymentId } });
      if (existingReceipt) {
        throw AppError.conflict("Receipt already exists for this payment");
      }

      // Verify payment is completed
      if (payment.status !== "COMPLETED") {
        throw AppError.badRequest("Can only generate receipt for completed payments");
      }

      // Verify user exists
      const user = await prisma.user.findFirst({ where: { id: userId, schoolId } });
      if (!user) throw AppError.notFound("User not found");

      // Get school for receipt
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) throw AppError.notFound("School not found");

      return prisma.receipt.create({
        data: {
          school: { connect: { id: schoolId } },
          payment: { connect: { id: paymentId } },
          student: { connect: { id: payment.studentId } },
          academicYear: { connect: { id: payment.academicYearId } },
          receiptNumber: payment.receiptNumber!,
          receiptDate: payment.paymentDate,
          amount: payment.amount,
          generatedBy: { connect: { id: userId } },
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMode: true,
              transactionRef: true,
              studentFee: {
                select: {
                  id: true,
                  fee: { select: { id: true, name: true } },
                },
              },
            },
          },
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          academicYear: { select: { id: true, name: true } },
          generatedBy: { select: { id: true, firstName: true, lastName: true } },
          school: { select: { id: true, name: true, code: true } },
        },
      });
    },

    async downloadReceipt(schoolId: string, id: string) {
      const receipt = await repo.findById(id);
      if (!receipt || receipt.schoolId !== schoolId) {
        throw AppError.notFound("Receipt not found");
      }

      // Return receipt data for PDF generation (placeholder)
      // In a real implementation, this would generate a PDF
      return receipt;
    },
  };
})();

export { receiptService };
export type ReceiptService = typeof receiptService;
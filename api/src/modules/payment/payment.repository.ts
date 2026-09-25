import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListPaymentsQuery } from "./payment.schemas.js";

export const paymentRepository = {
  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data });
  },

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        studentFee: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            fee: { select: { id: true, name: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
        receipt: { select: { id: true, receiptNumber: true, receiptDate: true } },
      },
    });
  },

  async findByReceiptNumber(receiptNumber: string) {
    return prisma.payment.findUnique({ where: { receiptNumber } });
  },

  async findMany(schoolId: string, query: ListPaymentsQuery) {
    const { page = 1, limit = 20, studentId, studentFeeId, academicYearId, paymentMode, status, dateFrom, dateTo } = query;
    const where: Prisma.PaymentWhereInput = {
      schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (studentFeeId) where.studentFeeId = studentFeeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (paymentMode) where.paymentMode = paymentMode;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          studentFee: {
            select: {
              id: true,
              totalAmount: true,
              paidAmount: true,
              balanceAmount: true,
              fee: { select: { id: true, name: true } },
            },
          },
          academicYear: { select: { id: true, name: true } },
          collectedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findByStudent(schoolId: string, studentId: string, academicYearId?: string) {
    const where: Prisma.PaymentWhereInput = { schoolId, studentId };
    if (academicYearId) where.academicYearId = academicYearId;
    return prisma.payment.findMany({
      where,
      include: {
        studentFee: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            fee: { select: { id: true, name: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
        receipt: { select: { id: true, receiptNumber: true, receiptDate: true } },
      },
      orderBy: { paymentDate: "desc" },
    });
  },

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        studentFee: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            fee: { select: { id: true, name: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.payment.delete({ where: { id } });
  },

  async generateReceiptNumber(schoolId: string) {
    const currentYear = new Date().getFullYear();
    const prefix = `RCPT-${currentYear}-`;

    const lastReceipt = await prisma.payment.findFirst({
      where: {
        schoolId,
        receiptNumber: { startsWith: prefix },
      },
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });

    let sequence = 1;
    if (lastReceipt?.receiptNumber) {
      const lastSeq = parseInt(lastReceipt.receiptNumber.replace(prefix, ""), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(6, "0")}`;
  },
};

export type PaymentRepository = typeof paymentRepository;
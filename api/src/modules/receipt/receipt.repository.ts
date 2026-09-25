import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListReceiptsQuery } from "./receipt.schemas.js";

export const receiptRepository = {
  async findById(id: string) {
    return prisma.receipt.findUnique({
      where: { id },
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

  async findByPaymentId(paymentId: string) {
    return prisma.receipt.findUnique({
      where: { paymentId },
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

  async findMany(schoolId: string, query: ListReceiptsQuery) {
    const { page = 1, limit = 20, studentId, academicYearId, dateFrom, dateTo, search } = query;
    const where: Prisma.ReceiptWhereInput = {
      schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (dateFrom || dateTo) {
      where.receiptDate = {};
      if (dateFrom) where.receiptDate.gte = new Date(dateFrom);
      if (dateTo) where.receiptDate.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { student: { admissionNo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMode: true,
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
        },
        orderBy: { receiptDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};

export type ReceiptRepository = typeof receiptRepository;
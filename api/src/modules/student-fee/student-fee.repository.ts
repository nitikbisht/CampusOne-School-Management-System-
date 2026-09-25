import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { ListStudentFeesQuery } from "./student-fee.schemas.js";

export const studentFeeRepository = {
  async create(data: Prisma.StudentFeeCreateInput) {
    return prisma.studentFee.create({ data });
  },

  async createMany(data: Prisma.StudentFeeCreateManyInput[]) {
    return prisma.studentFee.createMany({ data });
  },

  async findById(id: string) {
    return prisma.studentFee.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        fee: { select: { id: true, name: true, amount: true, frequency: true, feeType: { select: { id: true, name: true } } } },
        academicYear: { select: { id: true, name: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMode: true } },
      },
    });
  },

  async findByStudentAndFeeAndYear(studentId: string, feeId: string, academicYearId: string) {
    return prisma.studentFee.findUnique({
      where: {
        studentId_feeId_academicYearId: { studentId, feeId, academicYearId },
      },
    });
  },

  async findMany(schoolId: string, query: ListStudentFeesQuery) {
    const { page = 1, limit = 20, studentId, feeId, academicYearId, status, search } = query;
    const where: Prisma.StudentFeeWhereInput = {
      schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (feeId) where.feeId = feeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { student: { admissionNo: { contains: search, mode: "insensitive" } } },
        { fee: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.studentFee.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          fee: { select: { id: true, name: true, amount: true, frequency: true, feeType: { select: { id: true, name: true } } } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.studentFee.count({ where }),
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
    const where: Prisma.StudentFeeWhereInput = { schoolId, studentId };
    if (academicYearId) where.academicYearId = academicYearId;
    return prisma.studentFee.findMany({
      where,
      include: {
        fee: { select: { id: true, name: true, amount: true, frequency: true, feeType: { select: { id: true, name: true } } } },
        academicYear: { select: { id: true, name: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMode: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(id: string, data: Prisma.StudentFeeUpdateInput) {
    return prisma.studentFee.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        fee: { select: { id: true, name: true, amount: true, frequency: true, feeType: { select: { id: true, name: true } } } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.studentFee.delete({ where: { id } });
  },

  async getSummary(schoolId: string, studentId: string, academicYearId: string) {
    const studentFees = await prisma.studentFee.findMany({
      where: { schoolId, studentId, academicYearId },
      include: {
        fee: { select: { id: true, name: true, amount: true, frequency: true, feeType: { select: { id: true, name: true } } } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMode: true, status: true } },
      },
    });

    const totalAmount = studentFees.reduce((sum, sf) => sum + Number(sf.totalAmount), 0);
    const paidAmount = studentFees.reduce((sum, sf) => sum + Number(sf.paidAmount), 0);
    const balanceAmount = studentFees.reduce((sum, sf) => sum + Number(sf.balanceAmount), 0);

    const byFeeType = studentFees.reduce((acc, sf) => {
      const typeName = sf.fee.feeType?.name || "Other";
      if (!acc[typeName]) {
        acc[typeName] = { total: 0, paid: 0, balance: 0, fees: [] };
      }
      acc[typeName].total += Number(sf.totalAmount);
      acc[typeName].paid += Number(sf.paidAmount);
      acc[typeName].balance += Number(sf.balanceAmount);
      acc[typeName].fees.push(sf);
      return acc;
    }, {} as Record<string, { total: number; paid: number; balance: number; fees: typeof studentFees }>);

    return {
      studentFees,
      summary: {
        totalAmount,
        paidAmount,
        balanceAmount,
        feeCount: studentFees.length,
        paidCount: studentFees.filter((sf) => sf.status === "PAID").length,
        pendingCount: studentFees.filter((sf) => sf.status === "PENDING" || sf.status === "PARTIAL" || sf.status === "OVERDUE").length,
        byFeeType,
      },
    };
  },
};

export type StudentFeeRepository = typeof studentFeeRepository;
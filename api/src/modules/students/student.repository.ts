import { prisma } from "../../lib/prisma.js";

export interface NewStudent {
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  religion?: string;
  category?: string;
  nationality?: string;
  motherTongue?: string;
  aadharNumber?: string;
  photoUrl?: string;
  admissionDate: Date;
  status?: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN" | "ON_LEAVE";
}

export interface UpdateStudent {
  admissionNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  religion?: string;
  category?: string;
  nationality?: string;
  motherTongue?: string;
  aadharNumber?: string;
  photoUrl?: string;
  status?: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN" | "ON_LEAVE";
  admissionDate?: Date;
}

export interface StudentListOptions {
  schoolId: string;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const studentRepository = {
  async list(options: StudentListOptions) {
    const { schoolId, status, search, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { schoolId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { admissionNo: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { middleName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { admissionNo: "asc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById(schoolId: string, id: string) {
    return prisma.student.findFirst({ where: { id, schoolId } });
  },

  findByAdmissionNo(schoolId: string, admissionNo: string) {
    return prisma.student.findFirst({ where: { admissionNo, schoolId } });
  },

  create(schoolId: string, data: NewStudent) {
    return prisma.student.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateStudent) {
    return prisma.student.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.student.delete({ where: { id } });
  },
};

export type StudentRepository = typeof studentRepository;
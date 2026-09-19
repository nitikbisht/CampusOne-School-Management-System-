import { prisma } from "../../lib/prisma.js";

export interface NewParent {
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  occupation?: string;
  qualification?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isPrimary: boolean;
}

export interface UpdateParent {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  occupation?: string;
  qualification?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isPrimary?: boolean;
}

export interface ParentListOptions {
  schoolId: string;
  search?: string;
  page: number;
  limit: number;
}

export interface LinkChildInput {
  parentId: string;
  studentId: string;
  relation: string;
}

/** Data access only: no business rules here. Every query is scoped by schoolId. */
export const parentRepository = {
  async list(options: ParentListOptions) {
    const { schoolId, search, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { schoolId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { middleName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.parent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById(schoolId: string, id: string) {
    return prisma.parent.findFirst({ where: { id, schoolId } });
  },

  findByEmail(schoolId: string, email: string) {
    return prisma.parent.findFirst({ where: { email, schoolId } });
  },

  create(schoolId: string, data: NewParent) {
    return prisma.parent.create({ data: { schoolId, ...data } });
  },

  update(schoolId: string, id: string, data: UpdateParent) {
    return prisma.parent.update({ where: { id }, data });
  },

  delete(schoolId: string, id: string) {
    return prisma.parent.delete({ where: { id } });
  },

  linkChild(schoolId: string, data: LinkChildInput) {
    return prisma.parentStudent.create({
      data: { schoolId, ...data },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
      },
    });
  },

  unlinkChild(schoolId: string, parentId: string, studentId: string) {
    return prisma.parentStudent.delete({ where: { parentId_studentId: { parentId, studentId } } });
  },

  getChildren(schoolId: string, parentId: string) {
    return prisma.parentStudent.findMany({
      where: { parentId, schoolId },
      include: { student: true },
    });
  },

  getParents(schoolId: string, studentId: string) {
    return prisma.parentStudent.findMany({
      where: { studentId, schoolId },
      include: { parent: true },
    });
  },
};

export type ParentRepository = typeof parentRepository;
import { prisma } from "../../lib/prisma.js";

/** School repository for looking up schools by code or id */
export const schoolRepository = {
  async findById(id: string) {
    return prisma.school.findUnique({ where: { id } });
  },

  async findByCode(code: string) {
    return prisma.school.findUnique({ where: { code } });
  },

  async findByIdOrCode(input: string) {
    // Try as UUID first, then as code (case-insensitive)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    if (isUuid) {
      return this.findById(input);
    }
    return prisma.school.findFirst({ where: { code: { equals: input, mode: "insensitive" } } });
  },
};

export type SchoolRepository = typeof schoolRepository;
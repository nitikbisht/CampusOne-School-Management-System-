import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export interface UserWithRoles {
  id: string;
  schoolId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: { role: { name: string; permissions: { permission: { key: string } }[] } }[];
}

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const authRepository = {
  async findUserByEmail(schoolId: string, email: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async findUserById(schoolId: string, userId: string): Promise<UserWithRoles | null> {
    return prisma.user.findFirst({
      where: { id: userId, schoolId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async createRefreshToken(data: NewRefreshToken) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(userId: string, tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { userId, tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async updateUserLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  hashToken(token: string): string {
    return bcrypt.hashSync(token, 12);
  },

  verifyToken(token: string, hash: string): boolean {
    return bcrypt.compareSync(token, hash);
  },

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },
};

export type AuthRepository = typeof authRepository;
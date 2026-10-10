import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { schoolOnboardingRepository } from "./school-onboarding.repository.js";
import { auditService } from "../../lib/audit.js";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from "../../lib/permissions.js";
import type { Request } from "express";

const prisma = new PrismaClient();

/** Generate a secure temporary password */
function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/** Hash password using crypto (matching existing auth pattern) */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/** Create default roles for a new school */
async function createDefaultRoles(tx: PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">, schoolId: string) {
  // First ensure all permissions exist in the global catalog
  const permissions = await tx.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

  // Create roles and assign permissions
  for (const [name, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await tx.role.upsert({
      where: { schoolId_name: { schoolId, name } },
      update: {},
      create: { schoolId, name, isSystem: true },
    });

    // Sync permissions
    const existingPermissions = await tx.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingPermissionIds = new Set(existingPermissions.map((rp) => rp.permissionId));
    const desiredPermissionIds = keys.map((key) => permissionIdByKey.get(key) as string).filter(Boolean);

    // Remove permissions that are no longer in the default set
    const toRemove = existingPermissions.filter(
      (rp) => !desiredPermissionIds.includes(rp.permissionId),
    );
    if (toRemove.length > 0) {
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toRemove.map((rp) => rp.permissionId) } },
      });
    }

    // Add new permissions
    await tx.rolePermission.createMany({
      data: desiredPermissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }
}

export const schoolOnboardingService = {
  /**
   * Check uniqueness of school name, code, and email
   */
  async checkUniqueness(params: { name?: string; code?: string; email?: string }) {
    return schoolOnboardingRepository.checkUniqueness(params);
  },

  /**
   * Complete school onboarding: create school + initial user + provision defaults
   */
  async onboardSchool(
    input: {
      school: {
        name: string;
        code: string;
        address?: string;
        contactEmail: string;
        contactPhone?: string;
        timezone: string;
      };
      initialUser: {
        firstName: string;
        lastName: string;
        email: string;
        role: "Principal" | "Admin";
        tempPassword?: string;
        sendInvite: boolean;
      };
    },
    req: Request
  ) {
    const { school: schoolData, initialUser: userData } = input;

    // Check uniqueness first
    const uniqueness = await schoolOnboardingRepository.checkUniqueness({
      name: schoolData.name,
      code: schoolData.code,
      email: userData.email,
    });

    if (uniqueness.nameExists) throw new Error("School name already exists");
    if (uniqueness.codeExists) throw new Error("School code already exists");
    if (uniqueness.emailExists) throw new Error("Email already registered");

    // Generate temp password if not provided
    const tempPassword = userData.tempPassword || generateTempPassword();
    const passwordHash = hashPassword(tempPassword);

    // Create school with defaults in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create school with initial academic year and feature flags using repository
      const school = await schoolOnboardingRepository.createSchool({
        name: schoolData.name,
        code: schoolData.code,
        address: schoolData.address,
        contactEmail: schoolData.contactEmail,
        contactPhone: schoolData.contactPhone,
        timezone: schoolData.timezone,
      });

      // Create default roles for the new school
      await createDefaultRoles(tx, school.id);

      // Get the role for the school
      const role = await tx.role.findUnique({
        where: { schoolId_name: { schoolId: school.id, name: userData.role } },
      });

      if (!role) {
        throw new Error(`Role ${userData.role} not found for new school`);
      }

      // Create initial user with role assignment
      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          passwordHash,
          isActive: true,
          roles: {
            create: {
              roleId: role.id,
            },
          },
        },
      });

      return { school, user, tempPassword };
    });

    // Audit log
    await auditService.logFromRequest(
      req,
      "CREATE",
      "School",
      result.school.id,
      {
        oldValue: null,
        newValue: {
          name: result.school.name,
          code: result.school.code,
          contactEmail: result.school.contactEmail,
          timezone: result.school.timezone,
          initialUser: {
            email: result.user.email,
            role: userData.role,
          },
        },
      },
      result.school.id,
      "School onboarding completed"
    );

    return result;
  },

  /**
   * Get school details with stats
   */
  async getSchoolDetails(id: string) {
    return schoolOnboardingRepository.findSchoolById(id);
  },

  /**
   * Update school profile
   */
  async updateSchool(id: string, data: {
    name?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    timezone?: string;
  }, req: Request) {
    const oldSchool = await schoolOnboardingRepository.findSchoolById(id);
    if (!oldSchool) throw new Error("School not found");

    const updated = await schoolOnboardingRepository.updateSchool(id, data);

    await auditService.logFromRequest(
      req,
      "UPDATE",
      "School",
      id,
      {
        oldValue: {
          name: oldSchool.name,
          address: oldSchool.address,
          contactEmail: oldSchool.contactEmail,
          contactPhone: oldSchool.contactPhone,
          timezone: oldSchool.timezone,
        },
        newValue: data,
      },
      id,
      "School profile updated"
    );

    return updated;
  },

  /**
   * Toggle school active status
   */
  async toggleSchoolStatus(id: string, isActive: boolean, req: Request) {
    const oldSchool = await schoolOnboardingRepository.findSchoolById(id);
    if (!oldSchool) throw new Error("School not found");

    const updated = await schoolOnboardingRepository.updateSchool(id, { isActive });

    await auditService.logFromRequest(
      req,
      isActive ? "ACTIVATE" : "DEACTIVATE",
      "School",
      id,
      {
        oldValue: { isActive: oldSchool.isActive },
        newValue: { isActive },
      },
      id,
      `School ${isActive ? "activated" : "deactivated"}`
    );

    return updated;
  },

  /**
   * Deactivate school with confirmation
   */
  async deactivateSchool(id: string, req: Request, reason: string) {
    const oldSchool = await schoolOnboardingRepository.findSchoolById(id);
    if (!oldSchool) throw new Error("School not found");

    if (!oldSchool.isActive) throw new Error("School is already inactive");

    const updated = await schoolOnboardingRepository.deactivateSchool(id);

    await auditService.logFromRequest(
      req,
      "DEACTIVATE",
      "School",
      id,
      {
        oldValue: { isActive: true },
        newValue: { isActive: false, deactivationReason: reason },
      },
      id,
      reason
    );

    return updated;
  },
};

export type SchoolOnboardingService = typeof schoolOnboardingService;
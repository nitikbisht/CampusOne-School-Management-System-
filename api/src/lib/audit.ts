import { PrismaClient, Prisma } from "@prisma/client";
import type { Request } from "express";

const prisma = new PrismaClient();

export interface AuditLogInput {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  schoolId?: string;
  oldValue?: Prisma.JsonValue;
  newValue?: Prisma.JsonValue;
  reason?: string;
  ipAddress?: string;
}

/**
 * Audit logging service - writes audit log entries for all write operations
 * Call this from service methods after successful mutations
 */
export const auditService = {
  /**
   * Write an audit log entry
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          schoolId: input.schoolId,
          oldValue: input.oldValue as Prisma.InputJsonValue | undefined,
          newValue: input.newValue as Prisma.InputJsonValue | undefined,
          reason: input.reason,
          ipAddress: input.ipAddress,
        },
      });
    } catch (error) {
      // Never throw from audit logging - log error but don't break the main operation
      console.error("Failed to write audit log:", error);
    }
  },

  /**
   * Extract client IP from request
   */
  getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown"
    );
  },

  /**
   * Create audit log from request context and changes
   */
  async logFromRequest(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    changes: { oldValue?: unknown; newValue?: unknown },
    schoolId?: string,
    reason?: string
  ): Promise<void> {
    const actorUserId = req.auth?.userId;
    const ipAddress = this.getClientIp(req);

    await this.log({
      actorUserId,
      action,
      entityType,
      entityId,
      schoolId: schoolId ?? req.auth?.schoolId,
      oldValue: changes.oldValue as Prisma.JsonValue,
      newValue: changes.newValue as Prisma.JsonValue,
      reason,
      ipAddress,
    });
  },
};

export type AuditService = typeof auditService;
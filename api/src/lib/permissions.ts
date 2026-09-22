/**
 * Permission catalog (module:action). This file is the single source of truth:
 * the seed script writes it to the `permissions` table, routes reference it
 * through requirePermission(). Add new keys here when you add a module.
 */
export const PERMISSIONS = {
  // Auth
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_REFRESH: "auth:refresh",
  AUTH_PASSWORD_RESET: "auth:password_reset",

  // Academic
  ACADEMIC_YEAR_VIEW: "academic_year:view",
  ACADEMIC_YEAR_CREATE: "academic_year:create",
  ACADEMIC_YEAR_MANAGE: "academic_year:manage",
  CLASS_VIEW: "class:view",
  CLASS_CREATE: "class:create",
  CLASS_UPDATE: "class:update",
  CLASS_DELETE: "class:delete",
  CLASS_MANAGE: "class:manage",
  SECTION_VIEW: "section:view",
  SECTION_CREATE: "section:create",
  SECTION_UPDATE: "section:update",
  SECTION_DELETE: "section:delete",
  SECTION_MANAGE: "section:manage",
  SUBJECT_VIEW: "subject:view",
  SUBJECT_CREATE: "subject:create",
  SUBJECT_UPDATE: "subject:update",
  SUBJECT_DELETE: "subject:delete",
  SUBJECT_MANAGE: "subject:manage",
  SUBJECT_TYPE_VIEW: "subject_type:view",
  SUBJECT_TYPE_CREATE: "subject_type:create",
  SUBJECT_TYPE_UPDATE: "subject_type:update",
  SUBJECT_TYPE_DELETE: "subject_type:delete",
  SUBJECT_TYPE_MANAGE: "subject_type:manage",
  CLASS_SUBJECT_VIEW: "class_subject:view",
  CLASS_SUBJECT_CREATE: "class_subject:create",
  CLASS_SUBJECT_UPDATE: "class_subject:update",
  CLASS_SUBJECT_DELETE: "class_subject:delete",
  CLASS_SUBJECT_MANAGE: "class_subject:manage",

  // People (Students, Parents, Enrollment)
  STUDENT_VIEW: "student:view",
  STUDENT_CREATE: "student:create",
  STUDENT_UPDATE: "student:update",
  STUDENT_DELETE: "student:delete",
  STUDENT_MANAGE: "student:manage",
  PARENT_VIEW: "parent:view",
  PARENT_CREATE: "parent:create",
  PARENT_UPDATE: "parent:update",
  PARENT_DELETE: "parent:delete",
  PARENT_MANAGE: "parent:manage",
  STUDENT_ENROLLMENT_VIEW: "student_enrollment:view",
  STUDENT_ENROLLMENT_CREATE: "student_enrollment:create",
  STUDENT_ENROLLMENT_UPDATE: "student_enrollment:update",
  STUDENT_ENROLLMENT_DELETE: "student_enrollment:delete",
  STUDENT_ENROLLMENT_MANAGE: "student_enrollment:manage",

  // Fees
  FEE_VIEW: "fee:view",
  FEE_CREATE: "fee:create",
  FEE_UPDATE: "fee:update",
  FEE_DELETE: "fee:delete",
  FEE_MANAGE: "fee:manage",

  // Users & RBAC
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_MANAGE: "user:manage",
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_MANAGE: "role:manage",
  PERMISSION_LIST: "permission:list",

  // Auditing
  AUDIT_VIEW: "audit:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const PERMISSION_CATALOG = ALL_PERMISSIONS.map((key) => {
  const [module, action] = key.split(":");
  return { key, module: module as string, action: action as string };
});

const VIEW_ONLY: PermissionKey[] = [
  PERMISSIONS.ACADEMIC_YEAR_VIEW,
  PERMISSIONS.CLASS_VIEW,
  PERMISSIONS.SECTION_VIEW,
  PERMISSIONS.SUBJECT_VIEW,
  PERMISSIONS.SUBJECT_TYPE_VIEW,
  PERMISSIONS.CLASS_SUBJECT_VIEW,
];

const AUTH_BASIC: PermissionKey[] = [
  PERMISSIONS.AUTH_LOGIN,
  PERMISSIONS.AUTH_LOGOUT,
  PERMISSIONS.AUTH_REFRESH,
  PERMISSIONS.AUTH_PASSWORD_RESET,
];

const MANAGE_ACADEMIC: PermissionKey[] = [
  PERMISSIONS.ACADEMIC_YEAR_CREATE,
  PERMISSIONS.ACADEMIC_YEAR_MANAGE,
  PERMISSIONS.CLASS_CREATE,
  PERMISSIONS.CLASS_UPDATE,
  PERMISSIONS.CLASS_DELETE,
  PERMISSIONS.CLASS_MANAGE,
  PERMISSIONS.SECTION_CREATE,
  PERMISSIONS.SECTION_UPDATE,
  PERMISSIONS.SECTION_DELETE,
  PERMISSIONS.SECTION_MANAGE,
  PERMISSIONS.SUBJECT_CREATE,
  PERMISSIONS.SUBJECT_UPDATE,
  PERMISSIONS.SUBJECT_DELETE,
  PERMISSIONS.SUBJECT_MANAGE,
  PERMISSIONS.SUBJECT_TYPE_CREATE,
  PERMISSIONS.SUBJECT_TYPE_UPDATE,
  PERMISSIONS.SUBJECT_TYPE_DELETE,
  PERMISSIONS.SUBJECT_TYPE_MANAGE,
  PERMISSIONS.CLASS_SUBJECT_CREATE,
  PERMISSIONS.CLASS_SUBJECT_UPDATE,
  PERMISSIONS.CLASS_SUBJECT_DELETE,
  PERMISSIONS.CLASS_SUBJECT_MANAGE,
];

/** Starting point only: the school can change these later through role management. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Developer: ALL_PERMISSIONS,
  Principal: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE),
  "Vice Principal": ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE),
  Admin: ALL_PERMISSIONS.filter(
    (p) => p !== PERMISSIONS.ROLE_MANAGE && p !== PERMISSIONS.AUDIT_VIEW,
  ),
  Teacher: [...VIEW_ONLY, ...AUTH_BASIC],
  Student: AUTH_BASIC,
  Parent: AUTH_BASIC,
};
/**
 * Permission catalog (module:action). This file is the single source of truth:
 * the seed script writes it to the `permissions` table, routes reference it
 * through requirePermission(). Add new keys here when you add a module.
 */
export const PERMISSIONS = {
  ACADEMIC_YEAR_VIEW: "academic_year:view",
  ACADEMIC_YEAR_CREATE: "academic_year:create",
  ACADEMIC_YEAR_MANAGE: "academic_year:manage",
  CLASS_VIEW: "class:view",
  CLASS_MANAGE: "class:manage",
  SECTION_VIEW: "section:view",
  SECTION_MANAGE: "section:manage",
  SUBJECT_VIEW: "subject:view",
  SUBJECT_MANAGE: "subject:manage",
  USER_VIEW: "user:view",
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
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
];

/** Starting point only: the school can change these later through role management. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Developer: ALL_PERMISSIONS,
  Principal: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE),
  "Vice Principal": ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE),
  Admin: ALL_PERMISSIONS.filter(
    (p) => p !== PERMISSIONS.ROLE_MANAGE && p !== PERMISSIONS.AUDIT_VIEW,
  ),
  Teacher: VIEW_ONLY,
  Student: [],
  Parent: [],
};

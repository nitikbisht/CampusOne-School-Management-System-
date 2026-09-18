/** Who is making the request. Filled in by the authenticate middleware (Phase 2). */
export interface AuthContext {
  userId: string;
  schoolId: string;
  roles: string[];
  permissions: string[];
}

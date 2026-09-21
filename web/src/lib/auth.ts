import { apiFetch, ApiError } from "./api";

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  schoolId: string;
}

export interface AuthResponse {
  data:{user: User;}
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "demo";
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    schoolId: SCHOOL_ID,
  });
}

export async function logout(): Promise<void> {
  const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "demo";
  await apiFetch("/auth/logout", { method: "POST", schoolId: SCHOOL_ID });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "demo";
    const response = await apiFetch<AuthResponse>("/auth/me", { schoolId: SCHOOL_ID });
    return response.data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}
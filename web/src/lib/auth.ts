import { apiFetch, type ApiError } from "./api";

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
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiFetch<AuthResponse>("/auth/me");
    return response.user;
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
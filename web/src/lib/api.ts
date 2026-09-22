const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "demo";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extract items from API response.
 * Handles both paginated responses (data.items) and simple array responses (data).
 */
export function extractItems<T>(response: unknown): T[] {
  const data = (response as { data?: unknown }).data;
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null && "items" in data) {
    return (data as { items: T[] }).items;
  }
  return [];
}

/**
 * Extract pagination info from API response.
 * Returns null for simple array responses.
 */
export function extractPagination(response: unknown): { total: number; page: number; limit: number; totalPages: number } | null {
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as { total?: number; page?: number; limit?: number; totalPages?: number };
  if (typeof d.total === "number" && typeof d.page === "number" && typeof d.limit === "number" && typeof d.totalPages === "number") {
    return { total: d.total, page: d.page, limit: d.limit, totalPages: d.totalPages };
  }
  return null;
}

/** Typed fetch wrapper for the CampusOne API. All API calls in the web app go through this. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { schoolId?: string } = {}
): Promise<T> {
  const { schoolId = SCHOOL_ID, ...restInit } = init;
  // Use relative URL in browser so Next.js rewrites proxy to backend
  // This allows cookies to work cross-origin (frontend on :3000, backend on :4000)
  const isBrowser = typeof window !== "undefined";
  const baseUrl = isBrowser ? "" : API_URL;
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    ...restInit,
    headers: {
      "Content-Type": "application/json",
      "x-school-id": schoolId,
      ...restInit.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? res.statusText,
    );
  }

  return (await res.json()) as T;
}
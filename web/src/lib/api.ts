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

/** Typed fetch wrapper for the CampusOne API. All API calls in the web app go through this. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { schoolId?: string } = {}
): Promise<T> {
  const { schoolId = SCHOOL_ID, ...restInit } = init;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
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
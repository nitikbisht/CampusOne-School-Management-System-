import type { Request, RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import type { AuthContext } from "../types/auth.js";

/**
 * PLACEHOLDER: real authentication (login, JWT/session, refresh) is built in
 * Phase 2. Until then every protected route answers 401 so nothing is
 * accidentally exposed. The Phase 2 version will set req.auth.
 */
export const authenticate: RequestHandler = () => {
  throw AppError.unauthorized("Authentication is not implemented yet");
};

/** Use after authenticate. Every listed permission is required. */
export function requirePermission(...required: string[]): RequestHandler {
  return (req, _res, next) => {
    const auth = req.auth;
    if (!auth) throw AppError.unauthorized();

    const allowed = required.every((permission) => auth.permissions.includes(permission));
    if (!allowed) throw AppError.forbidden();

    next();
  };
}

/** Returns the authenticated user's context or throws 401. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

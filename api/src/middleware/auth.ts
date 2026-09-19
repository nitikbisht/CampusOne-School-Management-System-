import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../lib/errors.js";
import type { AuthContext } from "../types/auth.js";
import { authService } from "../modules/auth/auth.service.js";

/**
 * Extracts and validates JWT access token from cookie or Authorization header.
 * Attaches AuthContext to req.auth for downstream handlers.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    // Try cookie first, then Authorization header
    const accessToken = req.cookies?.access_token ?? req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) throw AppError.unauthorized("No access token provided");

    const auth = authService.verifyAccessToken(accessToken);

    // Verify user still exists and is active (optional: could cache this)
    // For now, trust the token payload; token refresh will re-validate

    req.auth = auth;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized("Invalid or expired access token");
  }
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

/** Optional authentication - sets req.auth if valid token present, continues either way */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const accessToken = req.cookies?.access_token ?? req.headers.authorization?.replace("Bearer ", "");
    if (accessToken) {
      const auth = authService.verifyAccessToken(accessToken);
      req.auth = auth;
    }
    next();
  } catch {
    next(); // Continue without auth
  }
};
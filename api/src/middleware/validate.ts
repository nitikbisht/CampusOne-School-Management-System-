import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../lib/errors.js";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates request parts with Zod and stores the parsed result in
 * res.locals.validated (Express 5 makes req.query read-only, so we don't overwrite it).
 * Read it in controllers with getValidated<T>(res).
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    const validated: Record<string, unknown> = {};

    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        throw AppError.validation(
          result.error.issues.map((issue) => ({
            in: part,
            path: issue.path.join("."),
            message: issue.message,
          })),
        );
      }
      validated[part] = result.data;
    }

    res.locals.validated = validated;
    next();
  };
}

export function getValidated<T extends { body?: unknown; query?: unknown; params?: unknown }>(
  res: Response,
): T {
  return res.locals.validated as T;
}

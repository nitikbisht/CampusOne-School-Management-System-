import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

function send(
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  res.status(status).json({
    error: { code, message, details, requestId: res.locals.requestId },
  });
}

/** One place that turns every error into the same JSON shape. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    send(res, err.status, err.code, err.message, err.details);
    return;
  }

  // Unique-constraint violation (e.g. duplicate name inside one school)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    send(res, 409, "CONFLICT", "A record with these values already exists", err.meta);
    return;
  }

  // Errors from Express itself (malformed JSON, payload too large, ...)
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    send(res, status, "BAD_REQUEST", "The request could not be processed");
    return;
  }

  logger.error({ err, requestId: res.locals.requestId }, "Unhandled error");
  send(res, 500, "INTERNAL_ERROR", "Something went wrong");
};

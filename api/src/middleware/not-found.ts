import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const notFound: RequestHandler = (req) => {
  throw AppError.notFound(`Route not found: ${req.method} ${req.path}`);
};

export type ErrorDetails = unknown;

/** Errors that are safe to show to API clients. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message = "Bad request", details?: ErrorDetails) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }
  static validation(details: ErrorDetails) {
    return new AppError(422, "VALIDATION_ERROR", "Request validation failed", details);
  }
  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have permission to do this") {
    return new AppError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found") {
    return new AppError(404, "NOT_FOUND", message);
  }
  static conflict(message = "Conflict", details?: ErrorDetails) {
    return new AppError(409, "CONFLICT", message, details);
  }
}

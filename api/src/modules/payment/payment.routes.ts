import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { paymentController } from "./payment.controller.js";
import { createPaymentSchema, updatePaymentSchema, listPaymentsQuerySchema, idParamSchema } from "./payment.schemas.js";

const studentIdParamsSchema = z.object({ studentId: z.uuid() });
const studentIdQuerySchema = z.object({ academicYearId: z.uuid().optional() });

export const paymentRoutes = Router();

// All routes require authentication
paymentRoutes.use(authenticate);

// List payments
paymentRoutes.get(
  "/",
  requirePermission(PERMISSIONS.PAYMENT_VIEW),
  validate({ query: listPaymentsQuerySchema.shape.query }),
  paymentController.list,
);

// Create payment
paymentRoutes.post(
  "/",
  requirePermission(PERMISSIONS.PAYMENT_CREATE),
  validate({ body: createPaymentSchema.shape.body }),
  paymentController.create,
);

// Get payments for a specific student
paymentRoutes.get(
  "/student/:studentId",
  requirePermission(PERMISSIONS.PAYMENT_VIEW),
  validate({ params: studentIdParamsSchema, query: studentIdQuerySchema }),
  paymentController.listByStudent,
);

// Get single payment
paymentRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.PAYMENT_VIEW),
  validate({ params: idParamSchema }),
  paymentController.get,
);

// Update payment
paymentRoutes.patch(
  "/:id",
  requirePermission(PERMISSIONS.PAYMENT_UPDATE),
  validate({ params: idParamSchema, body: updatePaymentSchema.shape.body }),
  paymentController.update,
);

// Delete payment
paymentRoutes.delete(
  "/:id",
  requirePermission(PERMISSIONS.PAYMENT_DELETE),
  validate({ params: idParamSchema }),
  paymentController.delete,
);
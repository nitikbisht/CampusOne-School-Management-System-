import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { receiptController } from "./receipt.controller.js";
import { listReceiptsQuerySchema, idParamSchema, generateReceiptSchema } from "./receipt.schemas.js";

const paymentIdParamsSchema = z.object({ paymentId: z.uuid() });

export const receiptRoutes = Router();

// All routes require authentication
receiptRoutes.use(authenticate);

// List receipts
receiptRoutes.get(
  "/",
  requirePermission(PERMISSIONS.RECEIPT_VIEW),
  validate({ query: listReceiptsQuerySchema.shape.query }),
  receiptController.list,
);

// Get receipt by payment ID
receiptRoutes.get(
  "/payment/:paymentId",
  requirePermission(PERMISSIONS.RECEIPT_VIEW),
  validate({ params: paymentIdParamsSchema }),
  receiptController.getByPayment,
);

// Generate receipt for a payment
receiptRoutes.post(
  "/generate/:paymentId",
  requirePermission(PERMISSIONS.RECEIPT_CREATE),
  validate({ params: generateReceiptSchema.shape.params }),
  receiptController.generate,
);

// Get single receipt
receiptRoutes.get(
  "/:id",
  requirePermission(PERMISSIONS.RECEIPT_VIEW),
  validate({ params: idParamSchema }),
  receiptController.get,
);

// Download receipt (PDF placeholder)
receiptRoutes.get(
  "/download/:id",
  requirePermission(PERMISSIONS.RECEIPT_DOWNLOAD),
  validate({ params: idParamSchema }),
  receiptController.download,
);
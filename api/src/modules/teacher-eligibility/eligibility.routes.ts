import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { eligibilityController } from "./eligibility.controller.js";
import { idParamSchema, createEligibilitySchema, updateEligibilitySchema, listEligibilitiesQuerySchema } from "./eligibility.schemas.js";

export const eligibilityRoutes = Router();

eligibilityRoutes.use(authenticate);

eligibilityRoutes.get("/", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_VIEW), validate({ query: listEligibilitiesQuerySchema }), eligibilityController.list);
eligibilityRoutes.get("/check", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_VIEW), eligibilityController.checkEligibility);
eligibilityRoutes.get("/:id", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_VIEW), validate({ params: idParamSchema }), eligibilityController.getById);
eligibilityRoutes.post("/", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_CREATE), validate({ body: createEligibilitySchema }), eligibilityController.create);
eligibilityRoutes.patch("/:id", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_UPDATE), validate({ params: idParamSchema, body: updateEligibilitySchema }), eligibilityController.update);
eligibilityRoutes.delete("/:id", requirePermission(PERMISSIONS.TEACHER_ELIGIBILITY_DELETE), validate({ params: idParamSchema }), eligibilityController.delete);
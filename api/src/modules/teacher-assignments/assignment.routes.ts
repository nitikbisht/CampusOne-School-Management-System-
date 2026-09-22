import { Router } from "express";
import { PERMISSIONS } from "../../lib/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { assignmentController } from "./assignment.controller.js";
import { idParamSchema, createAssignmentSchema, updateAssignmentSchema, listAssignmentsQuerySchema } from "./assignment.schemas.js";

export const assignmentRoutes = Router();

assignmentRoutes.use(authenticate);

assignmentRoutes.get("/", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_VIEW), validate({ query: listAssignmentsQuerySchema }), assignmentController.list);
assignmentRoutes.get("/teacher-year", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_VIEW), assignmentController.getByTeacherYear);
assignmentRoutes.get("/class-section-year", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_VIEW), assignmentController.getByClassSectionYear);
assignmentRoutes.get("/:id", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_VIEW), validate({ params: idParamSchema }), assignmentController.getById);
assignmentRoutes.post("/", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_CREATE), validate({ body: createAssignmentSchema }), assignmentController.create);
assignmentRoutes.patch("/:id", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_UPDATE), validate({ params: idParamSchema, body: updateAssignmentSchema }), assignmentController.update);
assignmentRoutes.delete("/:id", requirePermission(PERMISSIONS.TEACHER_ASSIGNMENT_DELETE), validate({ params: idParamSchema }), assignmentController.delete);
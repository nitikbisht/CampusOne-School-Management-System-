import { Router } from "express";
import { schoolOnboardingController } from "./school-onboarding.controller.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { z } from "zod";
import { PERMISSIONS } from "../../lib/permissions.js";

const router = Router();

// All routes require authentication and developer access
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.DEVELOPER_ACCESS));

// Query/param schemas
const checkUniquenessQuery = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  email: z.string().optional(),
});

const onboardSchoolBody = z.object({
  school: z.object({
    name: z.string().min(1).max(200).trim(),
    code: z.string().min(2).max(10).toUpperCase().trim(),
    address: z.string().max(500).optional(),
    contactEmail: z.email().toLowerCase().trim(),
    contactPhone: z.string().max(30).optional(),
    timezone: z.string().default("UTC"),
  }),
  initialUser: z.object({
    firstName: z.string().min(1).max(100).trim(),
    lastName: z.string().min(1).max(100).trim(),
    email: z.email().toLowerCase().trim(),
    role: z.enum(["Principal", "Admin"]),
    tempPassword: z.string().min(8).max(128).optional(),
    sendInvite: z.boolean().default(true),
  }),
});

const schoolIdParams = z.object({ id: z.string().uuid() });

const updateSchoolBody = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  address: z.string().max(500).optional(),
  contactEmail: z.email().toLowerCase().trim().optional(),
  contactPhone: z.string().max(30).optional(),
  timezone: z.string().optional(),
});

const toggleStatusBody = z.object({ isActive: z.boolean() });

const deactivateBody = z.object({ reason: z.string().min(1).max(500), confirmName: z.string().min(1) });

/**
 * @route   GET /api/v1/developer/schools/check-uniqueness
 * @desc    Check uniqueness of school name, code, email
 * @access  Developer
 */
router.get(
  "/check-uniqueness",
  validate({ query: checkUniquenessQuery }),
  schoolOnboardingController.checkUniqueness
);

/**
 * @route   POST /api/v1/developer/schools/onboard
 * @desc    Complete school onboarding (school + initial user)
 * @access  Developer
 */
router.post(
  "/onboard",
  validate({ body: onboardSchoolBody }),
  schoolOnboardingController.onboardSchool
);

/**
 * @route   GET /api/v1/developer/schools/:id
 * @desc    Get school details with stats
 * @access  Developer
 */
router.get(
  "/:id",
  validate({ params: schoolIdParams }),
  schoolOnboardingController.getSchoolDetails
);

/**
 * @route   PATCH /api/v1/developer/schools/:id
 * @desc    Update school profile
 * @access  Developer
 */
router.patch(
  "/:id",
  validate({ params: schoolIdParams, body: updateSchoolBody }),
  schoolOnboardingController.updateSchool
);

/**
 * @route   PATCH /api/v1/developer/schools/:id/status
 * @desc    Toggle school active status
 * @access  Developer
 */
router.patch(
  "/:id/status",
  validate({ params: schoolIdParams, body: toggleStatusBody }),
  schoolOnboardingController.toggleSchoolStatus
);

/**
 * @route   POST /api/v1/developer/schools/:id/deactivate
 * @desc    Deactivate school with confirmation
 * @access  Developer
 */
router.post(
  "/:id/deactivate",
  validate({ params: schoolIdParams, body: deactivateBody }),
  schoolOnboardingController.deactivateSchool
);

export const schoolOnboardingRoutes = router;
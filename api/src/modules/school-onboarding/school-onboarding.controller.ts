import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { schoolOnboardingService } from "./school-onboarding.service.js";
import { AppError } from "../../lib/errors.js";

export const schoolOnboardingController = {
  /**
   * POST /api/v1/developer/schools/onboard
   * Complete school onboarding in one call (or two-step via frontend)
   */
  async onboardSchool(req: Request, res: Response) {
    const { body } = getValidated<{ body: {
      school: {
        name: string;
        code: string;
        address?: string;
        contactEmail: string;
        contactPhone?: string;
        timezone: string;
      };
      initialUser: {
        firstName: string;
        lastName: string;
        email: string;
        role: "Principal" | "Admin";
        tempPassword?: string;
        sendInvite: boolean;
      };
    } }>(res);

    const result = await schoolOnboardingService.onboardSchool(body, req);
    res.status(201).json({
      success: true,
      data: result,
      message: "School onboarded successfully",
    });
  },

  /**
   * GET /api/v1/developer/schools/check-uniqueness
   * Check if name, code, or email already exists
   */
  async checkUniqueness(req: Request, res: Response) {
    const { query } = getValidated<{ query: { name?: string; code?: string; email?: string } }>(res);
    const result = await schoolOnboardingService.checkUniqueness(query);
    res.json({ success: true, data: result });
  },

  /**
   * GET /api/v1/developer/schools/:id
   * Get school details with stats
   */
  async getSchoolDetails(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const school = await schoolOnboardingService.getSchoolDetails(params.id);
    if (!school) {
      throw AppError.notFound("School not found");
    }
    res.json({ success: true, data: school });
  },

  /**
   * PATCH /api/v1/developer/schools/:id
   * Update school profile
   */
  async updateSchool(req: Request, res: Response) {
    const { params, body } = getValidated<{
      params: { id: string };
      body: { name?: string; address?: string; contactEmail?: string; contactPhone?: string; timezone?: string };
    }>(res);

    const updated = await schoolOnboardingService.updateSchool(params.id, body, req);
    res.json({ success: true, data: updated, message: "School updated successfully" });
  },

  /**
   * PATCH /api/v1/developer/schools/:id/status
   * Toggle school active status
   */
  async toggleSchoolStatus(req: Request, res: Response) {
    const { params, body } = getValidated<{
      params: { id: string };
      body: { isActive: boolean };
    }>(res);

    const updated = await schoolOnboardingService.toggleSchoolStatus(params.id, body.isActive, req);
    res.json({
      success: true,
      data: updated,
      message: `School ${body.isActive ? "activated" : "deactivated"} successfully`,
    });
  },

  /**
   * POST /api/v1/developer/schools/:id/deactivate
   * Deactivate school with confirmation (requires reason)
   */
  async deactivateSchool(req: Request, res: Response) {
    const { params, body } = getValidated<{
      params: { id: string };
      body: { reason: string; confirmName: string };
    }>(res);

    const school = await schoolOnboardingService.getSchoolDetails(params.id);
    if (!school) {
      throw AppError.notFound("School not found");
    }
    if (body.confirmName !== school.name) {
      throw AppError.badRequest("School name confirmation does not match");
    }
    const updated = await schoolOnboardingService.deactivateSchool(params.id, req, body.reason);
    res.json({
      success: true,
      data: updated,
      message: "School deactivated successfully",
    });
  },
};

export type SchoolOnboardingController = typeof schoolOnboardingController;
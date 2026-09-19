import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import { getValidated } from "../../middleware/validate.js";
import { authService } from "./auth.service.js";
import type { LoginInput, RefreshInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from "./auth.schemas.js";

export const authController = {
  async login(req: Request, res: Response) {
    const { body } = getValidated<{ body: LoginInput }>(res);
    const schoolId = req.headers["x-school-id"] as string;
    if (!schoolId) throw new Error("Missing x-school-id header");

    const { accessToken, refreshToken, auth } = await authService.login(schoolId, body.email, body.password);

    // Set cookies
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.json({ data: { user: { id: auth.userId, email: body.email, roles: auth.roles, permissions: auth.permissions } } });
  },

  async logout(req: Request, res: Response) {
    const auth = getAuth(req);
    await authService.logout(auth.userId);

    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    res.json({ data: { message: "Logged out successfully" } });
  },

  async refresh(req: Request, res: Response) {
    const { body } = getValidated<{ body: RefreshInput }>(res);
    const schoolId = req.headers["x-school-id"] as string;
    if (!schoolId) throw new Error("Missing x-school-id header");

    const { accessToken, refreshToken, auth } = await authService.refresh(schoolId, body.refreshToken);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ data: { user: { id: auth.userId, roles: auth.roles, permissions: auth.permissions } } });
  },

  async me(req: Request, res: Response) {
    const auth = getAuth(req);
    res.json({ data: { user: { id: auth.userId, schoolId: auth.schoolId, roles: auth.roles, permissions: auth.permissions } } });
  },

  // Forgot/Reset password - placeholder implementations
  async forgotPassword(req: Request, res: Response) {
    const { body } = getValidated<{ body: ForgotPasswordInput }>(res);
    // TODO: Implement email sending with reset token
    // For now, just return success (don't reveal if email exists)
    res.json({ data: { message: "If the email exists, a reset link has been sent" } });
  },

  async resetPassword(req: Request, res: Response) {
    const { body } = getValidated<{ body: ResetPasswordInput }>(res);
    // TODO: Implement password reset with token validation
    res.json({ data: { message: "Password reset successfully" } });
  },

  async changePassword(req: Request, res: Response) {
    const auth = getAuth(req);
    const { body } = getValidated<{ body: ChangePasswordInput }>(res);
    // TODO: Implement password change with current password verification
    res.json({ data: { message: "Password changed successfully" } });
  },
};
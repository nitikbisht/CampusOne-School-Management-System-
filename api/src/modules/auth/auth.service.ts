import { AppError } from "../../lib/errors.js";
import jwt from "jsonwebtoken";
import type { AuthContext } from "../../types/auth.js";
import { authRepository } from "./auth.repository.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

const JWT_SECRET = getEnv("JWT_SECRET");
const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");

function buildAuthContext(user: typeof authRepository extends { findUserByEmail: (s: string, e: string) => Promise<infer U> } ? U : never): AuthContext {
  const permissions = new Set<string>();
  const roles = new Set<string>();

  for (const ur of user.roles) {
    roles.add(ur.role.name);
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  return {
    userId: user.id,
    schoolId: user.schoolId,
    roles: Array.from(roles),
    permissions: Array.from(permissions),
  };
}

function signAccessToken(payload: Omit<AuthContext, "permissions"> & { permissions: string[] }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function signRefreshToken(payload: { userId: string; schoolId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
}

const authService = (() => {
  const repo = authRepository;
  return {
    async login(schoolId: string, email: string, password: string) {
      const user = await repo.findUserByEmail(schoolId, email);
      if (!user) throw AppError.unauthorized("Invalid email or password");
      if (!user.isActive) throw AppError.unauthorized("Account is deactivated");

      const valid = await repo.verifyToken(password, user.passwordHash);
      if (!valid) throw AppError.unauthorized("Invalid email or password");

      const auth = buildAuthContext(user);
      const accessToken = signAccessToken(auth);
      const refreshToken = repo.generateSecureToken();
      const refreshTokenHash = repo.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await repo.createRefreshToken({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      });

      await repo.updateUserLastLogin(user.id);

      return { accessToken, refreshToken, auth };
    },

    async refresh(schoolId: string, refreshToken: string) {
      const tokenHash = repo.hashToken(refreshToken);
      const stored = await repo.findRefreshTokenByHash(tokenHash);
      if (!stored) throw AppError.unauthorized("Invalid or expired refresh token");

      const user = await repo.findUserById(schoolId, stored.userId);
      if (!user || !user.isActive) throw AppError.unauthorized("User not found or deactivated");

      await repo.revokeRefreshToken(stored.id);

      const auth = buildAuthContext(user);
      const newAccessToken = signAccessToken(auth);
      const newRefreshToken = repo.generateSecureToken();
      const newRefreshTokenHash = repo.hashToken(newRefreshToken);
      const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await repo.createRefreshToken({
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, auth };
    },

    async logout(userId: string) {
      await repo.revokeAllUserRefreshTokens(userId);
    },

    verifyAccessToken(token: string): AuthContext {
      try {
        return jwt.verify(token, JWT_SECRET) as AuthContext;
      } catch {
        throw AppError.unauthorized("Invalid or expired access token");
      }
    },
  };
})();

export { authService };
export type AuthService = typeof authService;
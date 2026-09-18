import { Router } from "express";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

export const healthRoutes = Router();

// Is the process up? (used by hosting platforms)
healthRoutes.get("/live", (_req, res) => {
  res.json({ status: "ok" });
});

// Can the app reach its database?
healthRoutes.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  } catch (err) {
    logger.error({ err }, "Readiness check failed");
    res.status(503).json({ status: "error", database: "down" });
  }
});

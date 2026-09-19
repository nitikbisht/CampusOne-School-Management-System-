import { Router } from "express";
import { academicYearRoutes } from "./modules/academic-years/academic-year.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export const routes = Router();

routes.use("/health", healthRoutes);
routes.use("/auth", authRoutes);
routes.use("/academic-years", academicYearRoutes);
// Register each new module here: routes.use("/students", studentRoutes);

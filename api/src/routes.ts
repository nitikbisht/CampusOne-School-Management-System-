import { Router } from "express";
import { academicYearRoutes } from "./modules/academic-years/academic-year.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { classRoutes } from "./modules/classes/class.routes.js";
import { sectionRoutes } from "./modules/sections/section.routes.js";
import { subjectRoutes } from "./modules/subjects/subject.routes.js";
import { subjectTypeRoutes } from "./modules/subject-types/subject-type.routes.js";
import { classSubjectRoutes } from "./modules/class-subjects/class-subject.routes.js";
import { studentRoutes } from "./modules/students/student.routes.js";
import { parentRoutes } from "./modules/parents/parent.routes.js";
import { enrollmentRoutes } from "./modules/student-enrollments/enrollment.routes.js";

export const routes = Router();

routes.use("/health", healthRoutes);
routes.use("/auth", authRoutes);
routes.use("/academic-years", academicYearRoutes);
routes.use("/classes", classRoutes);
routes.use("/sections", sectionRoutes);
routes.use("/subjects", subjectRoutes);
routes.use("/subject-types", subjectTypeRoutes);
routes.use("/class-subjects", classSubjectRoutes);
routes.use("/students", studentRoutes);
routes.use("/parents", parentRoutes);
routes.use("/student-enrollments", enrollmentRoutes);

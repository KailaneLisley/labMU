import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const dashboardRouter = Router();

// Dashboard é exclusivo do administrador
dashboardRouter.use(authenticateToken, requireRole("administrador"));
dashboardRouter.get("/summary", DashboardController.summary);


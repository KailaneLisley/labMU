import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authenticateToken } from "../../middlewares/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);
dashboardRouter.get("/summary", DashboardController.summary);


import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { authenticateToken } from "../../middlewares/auth.js";

export const reportsRouter = Router();

reportsRouter.use(authenticateToken);

reportsRouter.get("/production", ReportsController.production);
reportsRouter.get("/production-by-technician", ReportsController.productionByTechnician);
reportsRouter.get("/stock-consumption", ReportsController.stockConsumption);
reportsRouter.get("/loans", ReportsController.loans);
reportsRouter.get("/maintenances", ReportsController.maintenances);


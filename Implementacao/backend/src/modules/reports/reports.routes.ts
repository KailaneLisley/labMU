import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const reportsRouter = Router();

reportsRouter.use(authenticateToken);

// O técnico precisa apenas dos números de manutenção (usados na própria tela).
// Os demais relatórios são gerenciais e exclusivos do administrador.
reportsRouter.get("/maintenances", ReportsController.maintenances);

reportsRouter.get("/production", requireRole("administrador"), ReportsController.production);
reportsRouter.get("/production-by-technician", requireRole("administrador"), ReportsController.productionByTechnician);
reportsRouter.get("/stock-consumption", requireRole("administrador"), ReportsController.stockConsumption);
reportsRouter.get("/loans", requireRole("administrador"), ReportsController.loans);

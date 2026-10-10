import { Router } from "express";
import { MaintenanceController } from "./maintenance.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticateToken);

maintenanceRouter.get("/", MaintenanceController.list);
maintenanceRouter.get("/:id", MaintenanceController.getById);

// Registro de manutenções por técnicos ou administradores
maintenanceRouter.post("/", requireRole("administrador", "tecnico"), MaintenanceController.create);
maintenanceRouter.patch("/:id", requireRole("administrador", "tecnico"), MaintenanceController.update);


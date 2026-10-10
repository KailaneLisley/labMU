import { Router } from "express";
import { ProductionController } from "./production.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const productionRouter = Router();

productionRouter.use(authenticateToken);

productionRouter.get("/", ProductionController.list);
productionRouter.get("/:id", ProductionController.getById);

// Registro de produção realizado por técnicos ou administradores
productionRouter.post("/", requireRole("administrador", "tecnico"), ProductionController.create);


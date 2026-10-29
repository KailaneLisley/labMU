import { Router } from "express";
import { SuppliesController } from "./supplies.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const suppliesRouter = Router();

suppliesRouter.use(authenticateToken);

// Listagem de suprimentos e histórico de movimentações
suppliesRouter.get("/", SuppliesController.list);
suppliesRouter.get("/movements", SuppliesController.listMovements);
suppliesRouter.get("/:id", SuppliesController.getById);

// Registro de entradas e novos suprimentos
suppliesRouter.post("/", requireRole("administrador", "tecnico"), SuppliesController.create);
suppliesRouter.post("/entries", requireRole("administrador", "tecnico"), SuppliesController.registerEntry);

// Edição e inativação de insumo (o saldo muda só por entradas, consumo e ajustes)
suppliesRouter.patch("/:id", requireRole("administrador", "tecnico"), SuppliesController.update);

// Ajuste manual de saldo (inventário e perdas), restrito a administradores
suppliesRouter.post("/adjustments", requireRole("administrador"), SuppliesController.adjust);


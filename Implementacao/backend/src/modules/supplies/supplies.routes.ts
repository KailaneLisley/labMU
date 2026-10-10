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


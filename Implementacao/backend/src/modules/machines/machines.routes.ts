import { Router } from "express";
import { MachinesController } from "./machines.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const machinesRouter = Router();

machinesRouter.use(authenticateToken);

machinesRouter.get("/", MachinesController.list);
machinesRouter.get("/:id", MachinesController.getById);

// Cadastros e alterações de máquinas são restritos a administradores e técnicos
machinesRouter.post("/", requireRole("administrador", "tecnico"), MachinesController.create);
machinesRouter.patch("/:id", requireRole("administrador", "tecnico"), MachinesController.update);
machinesRouter.delete("/:id", requireRole("administrador"), MachinesController.delete);


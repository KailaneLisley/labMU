import { Router } from "express";
import { EquipmentController } from "./equipment.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const equipmentRouter = Router();

equipmentRouter.use(authenticateToken);

equipmentRouter.get("/", EquipmentController.list);
equipmentRouter.get("/:id", EquipmentController.getById);
equipmentRouter.post("/", requireRole("administrador", "tecnico"), EquipmentController.create);


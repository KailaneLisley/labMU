import { Router } from "express";
import { LoansController } from "./loans.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const loansRouter = Router();

loansRouter.use(authenticateToken);

loansRouter.get("/", LoansController.list);
loansRouter.get("/:id", LoansController.getById);

// Retirada e devolução por técnicos ou administradores
loansRouter.post("/", requireRole("administrador", "tecnico"), LoansController.checkout);
loansRouter.post("/:id/return", requireRole("administrador", "tecnico"), LoansController.return);


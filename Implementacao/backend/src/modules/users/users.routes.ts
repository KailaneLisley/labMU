import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.js";

export const usersRouter = Router();

// Todas as rotas de usuários exigem autenticação
usersRouter.use(authenticateToken);

// Atualização do próprio perfil
usersRouter.patch("/me", UsersController.updateProfile);

// Listagem e busca de usuários (Acesso para administrador e técnico)
usersRouter.get("/", UsersController.list);
usersRouter.get("/:id", UsersController.getById);

// Criação, edição e status (Apenas administrador)
usersRouter.post("/", requireRole("administrador"), UsersController.create);
usersRouter.patch("/:id", requireRole("administrador"), UsersController.update);
usersRouter.patch("/:id/status", requireRole("administrador"), UsersController.updateStatus);


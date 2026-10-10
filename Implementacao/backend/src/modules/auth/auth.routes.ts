import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticateToken } from "../../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/register", AuthController.register);
authRouter.get("/me", authenticateToken, AuthController.getMe);
authRouter.post("/logout", AuthController.logout);


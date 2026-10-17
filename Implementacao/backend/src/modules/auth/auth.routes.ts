import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticateToken } from "../../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/register", AuthController.register);
authRouter.post("/forgot-password/verify-email", AuthController.verifyForgotEmail);
authRouter.post("/forgot-password/verify-answer", AuthController.verifyForgotAnswer);
authRouter.post("/forgot-password/reset", AuthController.resetPassword);
authRouter.get("/me", authenticateToken, AuthController.getMe);
authRouter.post("/logout", AuthController.logout);


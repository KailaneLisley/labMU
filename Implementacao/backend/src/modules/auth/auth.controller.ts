import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class AuthController {
  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const result = await AuthService.login(email, password, role, req.ip);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  static getMe = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Não autorizado." } });
        return;
      }
      const user = AuthService.getMe(req.user.id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  static verifyForgotEmail = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { email } = req.body;
      const result = AuthService.verifyForgotEmail(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static verifyForgotAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, answer } = req.body;
      const result = await AuthService.verifyForgotAnswer(email, answer, req.ip);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static requestAdminPasswordReset = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { email } = req.body;
      const result = AuthService.requestAdminPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, resetToken, newPassword } = req.body;
      const result = await AuthService.resetPassword({ email, resetToken, newPassword });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static logout = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (req.auth) {
        AuthService.logout(req.auth);
      }
      res.status(200).json({ message: "Logout realizado com sucesso." });
    } catch (error) {
      next(error);
    }
  };
}


import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class AuthController {
  static login = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { email, password, role } = req.body;
      const result = AuthService.login(email, password, role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static register = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = AuthService.register(req.body);
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

  static logout = (_req: Request, res: Response): void => {
    res.status(200).json({ message: "Logout realizado com sucesso." });
  };
}


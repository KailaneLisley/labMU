import { Response, NextFunction } from "express";
import { UsersService } from "./users.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class UsersController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { q, role, status, page, limit } = req.query;
      const result = UsersService.listUsers({
        q: q as string,
        role: role as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = UsersService.getUserById(String(req.params.id));
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = UsersService.createUser(req.body);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  static update = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = UsersService.updateUser(String(req.params.id), req.body);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  static updateStatus = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { status } = req.body;
      const user = UsersService.updateStatus(String(req.params.id), status);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  static updateProfile = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Não autorizado." } });
        return;
      }
      const { name, phone, avatar } = req.body;
      const user = UsersService.updateUser(req.user.id, { name, phone, avatar });
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };
}

import { Response, NextFunction } from "express";
import { EquipmentService } from "./equipment.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class EquipmentController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { q, status, category } = req.query;
      const equipment = EquipmentService.listEquipment({
        q: q as string,
        status: status as string,
        category: category as string,
      });
      res.status(200).json({ equipment });
    } catch (error) {
      next(error);
    }
  };

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const item = EquipmentService.getEquipmentById(String(req.params.id));
      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const item = EquipmentService.createEquipment(req.body);
      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  };
}

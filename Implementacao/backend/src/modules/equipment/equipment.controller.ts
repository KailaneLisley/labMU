import { Response, NextFunction } from "express";
import { EquipmentService } from "./equipment.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class EquipmentController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, status, category } = req.query;
      const equipment = await EquipmentService.listEquipment({
        q: q as string,
        status: status as string,
        category: category as string,
      });
      res.status(200).json({ equipment });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await EquipmentService.getEquipmentById(String(req.params.id));
      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  };

  static create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await EquipmentService.createEquipment(req.body);
      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await EquipmentService.updateEquipment(String(req.params.id), req.body);
      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  };

  static setStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await EquipmentService.setEquipmentStatus(String(req.params.id), req.body?.status);
      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  };
}

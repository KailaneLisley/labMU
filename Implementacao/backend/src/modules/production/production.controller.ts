import { Response, NextFunction } from "express";
import { ProductionService } from "./production.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class ProductionController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { machineId, technicianId, type, from, to } = req.query;
      const productions = await ProductionService.listProductions({
        machineId: machineId as string,
        technicianId: technicianId as string,
        type: type as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ productions });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const production = await ProductionService.getProductionById(String(req.params.id));
      res.status(200).json({ production });
    } catch (error) {
      next(error);
    }
  };

  static create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const production = await ProductionService.createProduction(req.body, req.user!);
      res.status(201).json({ production });
    } catch (error) {
      next(error);
    }
  };

  static cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const production = await ProductionService.cancelProduction(String(req.params.id), req.user!, req.body?.reason);
      res.status(200).json({ production });
    } catch (error) {
      next(error);
    }
  };
}

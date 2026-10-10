import { Response, NextFunction } from "express";
import { ProductionService } from "./production.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class ProductionController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { machineId, technicianId, type, from, to } = req.query;
      const productions = ProductionService.listProductions({
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

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const production = ProductionService.getProductionById(String(req.params.id));
      res.status(200).json({ production });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const production = ProductionService.createProduction({
        ...req.body,
        technicianId: req.body.technicianId || req.user?.id,
      });
      res.status(201).json({ production });
    } catch (error) {
      next(error);
    }
  };
}

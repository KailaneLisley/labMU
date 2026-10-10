import { Response, NextFunction } from "express";
import { SuppliesService } from "./supplies.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class SuppliesController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { q, status, type } = req.query;
      const supplies = SuppliesService.listSupplies({
        q: q as string,
        status: status as string,
        type: type as string,
      });
      res.status(200).json({ supplies });
    } catch (error) {
      next(error);
    }
  };

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const supply = SuppliesService.getSupplyById(String(req.params.id));
      res.status(200).json({ supply });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const supply = SuppliesService.createSupply(req.body);
      res.status(201).json({ supply });
    } catch (error) {
      next(error);
    }
  };

  static registerEntry = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const result = SuppliesService.registerEntry({
        ...req.body,
        userId: req.user?.id,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  static listMovements = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { supplyId, from, to } = req.query;
      const movements = SuppliesService.listMovements({
        supplyId: supplyId as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ movements });
    } catch (error) {
      next(error);
    }
  };
}

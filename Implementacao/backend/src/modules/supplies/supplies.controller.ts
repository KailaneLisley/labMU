import { Response, NextFunction } from "express";
import { SuppliesService } from "./supplies.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class SuppliesController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, status, type } = req.query;
      const supplies = await SuppliesService.listSupplies({
        q: q as string,
        status: status as string,
        type: type as string,
      });
      res.status(200).json({ supplies });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supply = await SuppliesService.getSupplyById(String(req.params.id));
      res.status(200).json({ supply });
    } catch (error) {
      next(error);
    }
  };

  static create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supply = await SuppliesService.createSupply(req.body);
      res.status(201).json({ supply });
    } catch (error) {
      next(error);
    }
  };

  static registerEntry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await SuppliesService.registerEntry({
        ...req.body,
        userId: req.user?.id,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  static adjust = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { supplyId, quantity, reason } = req.body;
      const result = await SuppliesService.adjustStock({
        supplyId,
        quantity,
        reason,
        userId: req.user?.id,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  static listMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { supplyId, from, to } = req.query;
      const movements = await SuppliesService.listMovements({
        supplyId: supplyId as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ movements });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supply = await SuppliesService.updateSupply(String(req.params.id), req.body);
      res.status(200).json({ supply });
    } catch (error) {
      next(error);
    }
  };
}

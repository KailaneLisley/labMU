import { Response, NextFunction } from "express";
import { MaintenanceService } from "./maintenance.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class MaintenanceController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { machineId, type, status, from, to } = req.query;
      const records = MaintenanceService.list({
        machineId: machineId as string,
        type: type as string,
        status: status as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ records });
    } catch (error) {
      next(error);
    }
  };

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const record = MaintenanceService.getById(String(req.params.id));
      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const record = MaintenanceService.create({
        ...req.body,
        technicianId: req.body.technicianId || req.user?.id,
      });
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  };

  static update = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const record = MaintenanceService.update(String(req.params.id), req.body);
      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  };
}

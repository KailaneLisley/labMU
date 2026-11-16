import { Response, NextFunction } from "express";
import { MaintenanceService } from "./maintenance.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class MaintenanceController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { machineId, type, status, from, to } = req.query;
      const records = await MaintenanceService.list({
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

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await MaintenanceService.getById(String(req.params.id));
      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  };

  static create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await MaintenanceService.create({
        ...req.body,
        technicianId: req.body.technicianId || req.user?.id,
      });
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await MaintenanceService.update(String(req.params.id), req.body);
      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  };
}

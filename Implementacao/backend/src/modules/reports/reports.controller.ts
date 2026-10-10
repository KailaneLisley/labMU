import { Response, NextFunction } from "express";
import { ReportsService } from "./reports.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class ReportsController {
  static production = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { from, to, technicianId } = req.query;
      const report = ReportsService.getProductionReport({
        from: from as string,
        to: to as string,
        technicianId: technicianId as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };

  static productionByTechnician = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { from, to } = req.query;
      const report = ReportsService.getProductionByTechnician({
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  };

  static stockConsumption = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { from, to } = req.query;
      const report = ReportsService.getStockConsumption({
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  };

  static loans = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { from, to } = req.query;
      const report = ReportsService.getLoansReport({
        from: from as string,
        to: to as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };

  static maintenances = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { from, to } = req.query;
      const report = ReportsService.getMaintenancesReport({
        from: from as string,
        to: to as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };
}


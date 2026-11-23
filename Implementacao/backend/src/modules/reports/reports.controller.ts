import { Response, NextFunction } from "express";
import { ReportsService } from "./reports.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class ReportsController {
  static production = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to, technicianId } = req.query;
      const report = await ReportsService.getProductionReport({
        from: from as string,
        to: to as string,
        technicianId: technicianId as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };

  static productionByTechnician = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to, groupBy } = req.query;
      const report = await ReportsService.getProductionByTechnician({
        from: from as string,
        to: to as string,
        groupBy: groupBy as string,
      });
      res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  };

  static stockConsumption = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;
      const report = await ReportsService.getStockConsumption({
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  };

  static loans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;
      const report = await ReportsService.getLoansReport({
        from: from as string,
        to: to as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };

  static maintenances = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;
      const report = await ReportsService.getMaintenancesReport({
        from: from as string,
        to: to as string,
      });
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };
}


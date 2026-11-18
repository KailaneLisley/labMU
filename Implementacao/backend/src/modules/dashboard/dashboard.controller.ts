import { Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class DashboardController {
  static summary = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await DashboardService.getSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  };
}


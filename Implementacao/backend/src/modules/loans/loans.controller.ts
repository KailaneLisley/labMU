import { Response, NextFunction } from "express";
import { LoansService } from "./loans.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class LoansController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, equipmentId, from, to } = req.query;
      const loans = await LoansService.listLoans({
        status: status as string,
        equipmentId: equipmentId as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ loans });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loan = await LoansService.getLoanById(String(req.params.id));
      res.status(200).json({ loan });
    } catch (error) {
      next(error);
    }
  };

  static checkout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loan = await LoansService.checkoutLoan({
        ...req.body,
        operatorId: req.user?.id,
      });
      res.status(201).json({ loan });
    } catch (error) {
      next(error);
    }
  };

  static return = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loan = await LoansService.returnLoan(String(req.params.id), req.user?.id);
      res.status(200).json({ loan });
    } catch (error) {
      next(error);
    }
  };
}

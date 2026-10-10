import { Response, NextFunction } from "express";
import { LoansService } from "./loans.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class LoansController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { status, equipmentId, from, to } = req.query;
      const loans = LoansService.listLoans({
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

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const loan = LoansService.getLoanById(String(req.params.id));
      res.status(200).json({ loan });
    } catch (error) {
      next(error);
    }
  };

  static checkout = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const loan = LoansService.checkoutLoan({
        ...req.body,
        operatorId: req.user?.id,
      });
      res.status(201).json({ loan });
    } catch (error) {
      next(error);
    }
  };

  static return = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const loan = LoansService.returnLoan(String(req.params.id), req.user?.id);
      res.status(200).json({ loan });
    } catch (error) {
      next(error);
    }
  };
}

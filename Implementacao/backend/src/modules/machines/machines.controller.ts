import { Response, NextFunction } from "express";
import { MachinesService } from "./machines.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class MachinesController {
  static list = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { q, type, status } = req.query;
      const machines = MachinesService.listMachines({
        q: q as string,
        type: type as string,
        status: status as string,
      });
      res.status(200).json({ machines });
    } catch (error) {
      next(error);
    }
  };

  static getById = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const machine = MachinesService.getMachineById(String(req.params.id));
      res.status(200).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static create = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const machine = MachinesService.createMachine(req.body);
      res.status(201).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static update = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const machine = MachinesService.updateMachine(String(req.params.id), req.body);
      res.status(200).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static delete = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const result = MachinesService.deleteMachine(String(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

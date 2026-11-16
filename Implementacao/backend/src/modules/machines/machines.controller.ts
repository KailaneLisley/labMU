import { Response, NextFunction } from "express";
import { MachinesService } from "./machines.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

export class MachinesController {
  static list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, type, status } = req.query;
      const machines = await MachinesService.listMachines({
        q: q as string,
        type: type as string,
        status: status as string,
      });
      res.status(200).json({ machines });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const machine = await MachinesService.getMachineById(String(req.params.id));
      res.status(200).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const machine = await MachinesService.createMachine(req.body);
      res.status(201).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const machine = await MachinesService.updateMachine(String(req.params.id), req.body);
      res.status(200).json({ machine });
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await MachinesService.deleteMachine(String(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

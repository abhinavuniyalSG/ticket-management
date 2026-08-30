import type { Request, Response, NextFunction } from "express";
import {
  DepartmentService,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from "../services/department.service.js";
import type { RequesterInfo } from "../services/user.service.js";

export class DepartmentController {
  public static getAllDepartmentsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await DepartmentService.getAllDepartments();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static getDepartmentDetailsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const result = await DepartmentService.getDepartmentById(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static createDepartmentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as CreateDepartmentInput) ?? req.body;
      const result = await DepartmentService.createDepartment(requester, body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static updateDepartmentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as UpdateDepartmentInput) ?? req.body;
      const result = await DepartmentService.updateDepartment(
        requester,
        id,
        body,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static deleteDepartmentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await DepartmentService.deleteDepartment(requester, id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

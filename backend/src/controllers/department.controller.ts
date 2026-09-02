import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import {
  DepartmentService,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type DepartmentQueryInput,
} from "../services/department.service.js";
import type { RequesterInfo } from "../services/user.service.js";

export class DepartmentController {
  public static getAllDepartmentsController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const query =
        (req.normalized?.query as DepartmentQueryInput) ?? req.query;
      const result = await DepartmentService.getAllDepartments(query);
      return res.status(200).json(result);
  });

  public static getDepartmentDetailsController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const result = await DepartmentService.getDepartmentById(id);
      return res.status(200).json(result);
  });

  public static createDepartmentController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as CreateDepartmentInput) ?? req.body;
      const result = await DepartmentService.createDepartment(requester, body);
      return res.status(201).json(result);
  });

  public static updateDepartmentController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as UpdateDepartmentInput) ?? req.body;
      const result = await DepartmentService.updateDepartment(
        requester,
        id,
        body,
      );
      return res.status(200).json(result);
  });

  public static deleteDepartmentController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await DepartmentService.deleteDepartment(requester, id);
      return res.status(200).json(result);
  });
}

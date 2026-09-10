import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import {
  UserService,
  type RequesterInfo,
  type UpdateUserInput,
  type UserQueryInput,
} from "../services/user.service.js";
import type { roleEnum } from "../types/user.js";

interface UserListQueryParams {
  department?: string;
  firstName?: string;
  role?: roleEnum;
  page?: number;
  limit?: number;
}

export class UserController {
  public static getAllUsersController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const requester = req.user as RequesterInfo;
      const rawQuery =
        (req.normalized?.query as UserListQueryParams) ??
        (req.query as UserListQueryParams);
      const query: UserQueryInput = {
        department: rawQuery.department,
        firstName: rawQuery.firstName,
        role: rawQuery.role,
        page: rawQuery.page,
        limit: rawQuery.limit,
      };
      const result = await UserService.getAllUsers(requester, query);
      return res.status(200).json(result);
  });

  public static getUserDetailsController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await UserService.getUserById(id, requester);
      return res.status(200).json(result);
  });

  public static updateUserController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const updateData = (req.normalized?.body as UpdateUserInput) ?? req.body;
      const requester = req.user as RequesterInfo;
      const result = await UserService.updateUser(id, updateData, requester);
      return res.status(200).json(result);
  });

  public static deleteUserController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await UserService.deleteUser(id, requester);
      return res.status(200).json(result);
  });
}

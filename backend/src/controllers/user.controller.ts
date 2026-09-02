import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import {
  UserService,
  type AddContactInput,
  type RequesterInfo,
  type UpdateContactInput,
  type UpdateUserInput,
  type UserQueryInput,
} from "../services/user.service.js";
import type { roleEnum } from "../types/user.js";

interface UserListQueryParams {
  department?: string;
  firstName?: string;
  role?: roleEnum;
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

  public static addContactController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const data = (req.normalized?.body as AddContactInput) ?? req.body;
      const userId = req.user?.id ?? "";
      const result = await UserService.addContact(userId, data);
      return res.status(201).json(result);
  });

  public static updateContactController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { contactId } =
        (req.normalized?.params as { contactId: string }) ?? req.params;
      const updates = (req.normalized?.body as UpdateContactInput) ?? req.body;
      const userId = req.user?.id ?? "";
      const result = await UserService.updateContact(
        userId,
        contactId,
        updates,
      );
      return res.status(200).json(result);
  });

  public static deleteContactController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { contactId } =
        (req.normalized?.params as { contactId: string }) ?? req.params;
      const userId = req.user?.id ?? "";
      const result = await UserService.deleteContact(userId, contactId);
      return res.status(200).json(result);
  });
}

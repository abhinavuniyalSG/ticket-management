import type { Request, Response, NextFunction } from "express";
import {
  UserService,
  type AddContactInput,
  type RequesterInfo,
  type UpdateContactInput,
  type UpdateUserInput,
} from "../services/user.service.js";

export class UserController {
  public static getAllUsersController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const requester = req.user as RequesterInfo;
      const result = await UserService.getAllUsers(requester);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static getUserDetailsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await UserService.getUserById(id, requester);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static updateUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const updateData = (req.normalized?.body as UpdateUserInput) ?? req.body;
      const requester = req.user as RequesterInfo;
      const result = await UserService.updateUser(id, updateData, requester);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static deleteUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await UserService.deleteUser(id, requester);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static addContactController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = (req.normalized?.body as AddContactInput) ?? req.body;
      const userId = req.user?.id ?? "";
      const result = await UserService.addContact(userId, data);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static updateContactController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
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
    } catch (error) {
      next(error);
    }
  };

  public static deleteContactController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { contactId } =
        (req.normalized?.params as { contactId: string }) ?? req.params;
      const userId = req.user?.id ?? "";
      const result = await UserService.deleteContact(userId, contactId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

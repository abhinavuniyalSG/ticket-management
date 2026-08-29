import type { Request, Response, NextFunction } from "express";
import { AuthenticationService } from "../services/authentication.service.js";

export class AuthenticationController {
  public static registerController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = req.normalized?.body ?? req.body;

      const result = await AuthenticationService.register(data);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static loginController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = req.normalized?.body ?? req.body;
      const result = await AuthenticationService.login(data);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static refreshController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = req.normalized?.body ?? req.body;
      const result = await AuthenticationService.refresh(data.refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public static logoutController = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await AuthenticationService.logout(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

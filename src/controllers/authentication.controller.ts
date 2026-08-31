import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import { AuthenticationService } from "../services/authentication.service.js";

export class AuthenticationController {
  public static registerController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const data = req.normalized?.body ?? req.body;

      const result = await AuthenticationService.register(data);

      return res.status(201).json(result);
  });

  public static loginController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const data = req.normalized?.body ?? req.body;
      const result = await AuthenticationService.login(data);
      return res.status(200).json(result);
  });

  public static refreshController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const data = req.normalized?.body ?? req.body;
      const result = await AuthenticationService.refresh(data.refreshToken);
      return res.status(200).json(result);
  });

  public static logoutController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await AuthenticationService.logout(userId);
      return res.status(200).json(result);
  });
}

import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import {
  DashboardService,
  type DashboardQueryInput,
} from "../services/dashboard.service.js";
import type { RequesterInfo } from "../services/ticket.service.js";

export class DashboardController {
  public static getDashboardController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const requester = req.user as RequesterInfo;
    const query =
      (req.normalized?.query as DashboardQueryInput) ?? req.query;
    const result = await DashboardService.getDashboard(requester, query);
    return res.status(200).json(result);
  });

  public static getDashboardOverviewController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const requester = req.user as RequesterInfo;
    const query =
      (req.normalized?.query as Pick<DashboardQueryInput, "period">) ??
      req.query;
    const result = await DashboardService.getDashboardOverview(
      requester,
      query,
    );
    return res.status(200).json(result);
  });
}

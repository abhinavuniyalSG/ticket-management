import { catchAsync } from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";
import {
  TicketService,
  type CreateTicketInput,
  type RequesterInfo,
  type TicketQueryInput,
  type UpdateTicketInput,
} from "../services/ticket.service.js";

export class TicketController {
  public static getAllTicketsController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const requester = req.user as RequesterInfo;
      const query = (req.normalized?.query as TicketQueryInput) ?? req.query;
      const result = await TicketService.getAllTickets(requester, query);
      return res.status(200).json(result);
  });

  public static getTicketDetailsController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await TicketService.getTicketById(id, requester);
      return res.status(200).json(result);
  });

  public static createTicketController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as CreateTicketInput) ?? req.body;
      const result = await TicketService.createTicket(requester, body);
      return res.status(201).json(result);
  });

  public static updateTicketController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const body = (req.normalized?.body as UpdateTicketInput) ?? req.body;
      const result = await TicketService.updateTicket(id, body, requester);
      return res.status(200).json(result);
  });

  public static deleteTicketController = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { id } = (req.normalized?.params as { id: string }) ?? req.params;
      const requester = req.user as RequesterInfo;
      const result = await TicketService.deleteTicket(id, requester);
      return res.status(200).json(result);
  });
}

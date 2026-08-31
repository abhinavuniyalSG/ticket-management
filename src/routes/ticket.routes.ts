import express from "express";
import { TicketController } from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { TicketSchema } from "../validationSchema/ticket.schema.js";

class TicketRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new TicketSchema();

  private initialize = () => {
    this.router.use(authMiddleware);

    this.router.get(
      "/",
      this.validator("query", this.requestSchema.ticketQuerySchema),
      TicketController.getAllTicketsController,
    );

    this.router.get(
      "/:id",
      this.validator("params", this.requestSchema.ticketIdParamSchema),
      TicketController.getTicketDetailsController,
    );

    this.router.post(
      "/",
      this.validator("body", this.requestSchema.createTicketSchema),
      TicketController.createTicketController,
    );

    this.router.patch(
      "/:id",
      this.validator("params", this.requestSchema.ticketIdParamSchema),
      this.validator("body", this.requestSchema.updateTicketSchema),
      TicketController.updateTicketController,
    );

    this.router.delete(
      "/:id",
      this.validator("params", this.requestSchema.ticketIdParamSchema),
      TicketController.deleteTicketController,
    );
  };

  constructor() {
    this.initialize();
  }
}

export default new TicketRoutes().router;

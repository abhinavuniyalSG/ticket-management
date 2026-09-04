import express from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { requireVerifiedEmail } from "../middleware/emailVerification.middleware.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { DashboardSchema } from "../validationSchema/dashboard.schema.js";

class DashboardRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new DashboardSchema();

  private initialize = () => {
    this.router.use(authMiddleware, requireVerifiedEmail);

    this.router.get(
      "/overview",
      this.validator("query", this.requestSchema.dashboardOverviewQuerySchema),
      DashboardController.getDashboardOverviewController,
    );

    this.router.get(
      "/",
      this.validator("query", this.requestSchema.dashboardQuerySchema),
      DashboardController.getDashboardController,
    );
  };

  constructor() {
    this.initialize();
  }
}

export default new DashboardRoutes().router;

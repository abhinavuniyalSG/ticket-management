import express from "express";
import { AuthenticationController } from "../controllers/authentication.controller.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { AuthenticationSchema } from "../validationSchema/authentication.schema.js";

class AuthenticationRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new AuthenticationSchema();
  private initialize = () => {
    this.router.post(
      "/register",
      this.validator("body", this.requestSchema.registerSchema),
      AuthenticationController.registerController,
    );
    this.router.post(
      "/login",
      this.validator("body", this.requestSchema.loginSchema),
      AuthenticationController.loginController,
    );
    this.router.post(
      "/refresh",
      this.validator("body", this.requestSchema.refreshTokenSchema),
      AuthenticationController.refreshController,
    );
    this.router.post("/logout", AuthenticationController.logoutController);
  };
  constructor() {
    this.initialize();
  }
}

export default new AuthenticationRoutes().router;

import express from "express";
import { AuthenticationController } from "../controllers/authentication.controller.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { AuthenticationSchema } from "../validationSchema/authentication.schema.js";
import { RateLimiterMiddleware } from "../middleware/rateLimiter.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";

class AuthenticationRoutes {
  public router = express.Router();
  private limiter = RateLimiterMiddleware.loginLimiter;
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
      this.limiter,
      this.validator("body", this.requestSchema.loginSchema),
      AuthenticationController.loginController,
    );
    this.router.post("/refresh", AuthenticationController.refreshController);
    this.router.post("/logout", authMiddleware, AuthenticationController.logoutController);
    this.router.post(
      "/change-password",
      authMiddleware,
      this.limiter,
      this.validator("body", this.requestSchema.changePasswordSchema),
      AuthenticationController.changePasswordController,
    );
    this.router.post(
      "/changepassword/email",
      RateLimiterMiddleware.forgotPasswordLimiter,
      this.validator("body", this.requestSchema.forgotPasswordSchema),
      AuthenticationController.forgotPasswordController,
    );
    this.router.post(
      "/changepassword/verify/:token",
      this.limiter,
      this.validator("params", this.requestSchema.resetPasswordParamSchema),
      this.validator("body", this.requestSchema.resetPasswordSchema),
      AuthenticationController.resetPasswordController,
    );
    this.router.get(
      "/verify-email/:token",
      this.validator("params", this.requestSchema.verifyEmailParamSchema),
      AuthenticationController.verifyEmailController,
    );
    this.router.post(
      "/resend-verification",
      this.limiter,
      this.validator("body", this.requestSchema.resendVerificationSchema),
      AuthenticationController.resendVerificationController,
    );
  };
  constructor() {
    this.initialize();
  }
}

export default new AuthenticationRoutes().router;

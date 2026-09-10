import express from "express";
import { AuthenticationController } from "../controllers/authentication.controller.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { AuthenticationSchema } from "../validationSchema/authentication.schema.js";
import { RateLimiterMiddleware } from "../middleware/rateLimiter.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";

class AuthenticationRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new AuthenticationSchema();
  private initialize = () => {
    this.router.post(
      "/register",
      RateLimiterMiddleware.registerLimiter,
      this.validator("body", this.requestSchema.registerSchema),
      AuthenticationController.registerController,
    );
    this.router.post(
      "/login",
      RateLimiterMiddleware.loginLimiter,
      this.validator("body", this.requestSchema.loginSchema),
      AuthenticationController.loginController,
    );
    this.router.post("/refresh", AuthenticationController.refreshController);
    this.router.post("/logout", authMiddleware, AuthenticationController.logoutController);
    this.router.post(
      "/change-password",
      authMiddleware,
      RateLimiterMiddleware.changePasswordLimiter,
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
      RateLimiterMiddleware.resetPasswordLimiter,
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
      RateLimiterMiddleware.resendVerificationLimiter,
      this.validator("body", this.requestSchema.resendVerificationSchema),
      AuthenticationController.resendVerificationController,
    );
  };
  constructor() {
    this.initialize();
  }
}

export default new AuthenticationRoutes().router;

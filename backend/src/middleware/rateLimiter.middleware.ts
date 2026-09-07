import rateLimit from "express-rate-limit";

export class RateLimiterMiddleware {
  private static globalLimiterConfig = {
    windowMs: 1 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7" as const,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 1 minutes",
  };

  private static loginLimiterConfig = {
    windowMs: 60 * 1000,
    limit: 5,

    standardHeaders: "draft-7" as const,
    legacyHeaders: false,

    message:
      "Too many login attempts from this IP, please try again after 1 minute",
  };

  private static forgotPasswordLimiterConfig = {
    windowMs: 3 * 60 * 1000,
    limit: 1,

    standardHeaders: "draft-7" as const,
    legacyHeaders: false,

    message:
      "Too many password reset requests from this IP, please try again after 3 minutes",
  };

  public static globalLimiter = rateLimit(
    RateLimiterMiddleware.globalLimiterConfig,
  );

  public static loginLimiter = rateLimit(
    RateLimiterMiddleware.loginLimiterConfig,
  );

  public static forgotPasswordLimiter = rateLimit(
    RateLimiterMiddleware.forgotPasswordLimiterConfig,
  );
}

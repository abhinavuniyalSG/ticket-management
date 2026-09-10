import rateLimit from "express-rate-limit";

export class RateLimiterMiddleware {
  private static globalLimiterConfig = {
    windowMs: 1 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7" as const,
    legacyHeaders: false,
    // An object body (rather than a plain string) makes express-rate-limit
    // respond with JSON instead of plain text, so the frontend's JSON parser
    // can actually read the message instead of falling back to a generic one.
    message: { message: "Too many requests from this IP, please try again after 1 minute" },
  };

  /**
   * Builds a standalone 5-requests-per-60-seconds limiter with its own
   * counter store. Each call returns an independent rateLimit() instance -
   * reusing a single instance across unrelated routes (e.g. login and
   * resend-verification) would mean they share one counter, so hitting one
   * endpoint could lock a user out of a completely different one with a
   * message that doesn't even describe what they actually did.
   */
  private static createActionLimiter(message: string) {
    return rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: "draft-7" as const,
      legacyHeaders: false,
      message: { message },
    });
  }

  private static forgotPasswordLimiterConfig = {
    windowMs: 3 * 60 * 1000,
    limit: 1,

    standardHeaders: "draft-7" as const,
    legacyHeaders: false,

    message: {
      message: "Too many password reset requests from this IP, please try again after 3 minutes",
    },
  };

  public static globalLimiter = rateLimit(
    RateLimiterMiddleware.globalLimiterConfig,
  );

  public static loginLimiter = RateLimiterMiddleware.createActionLimiter(
    "Too many login attempts from this IP, please try again after 1 minute",
  );

  // /register has no other rate limiting, which makes its "User already
  // exists" response an easy mass email-enumeration oracle. This won't stop
  // one-at-a-time probing, but it makes probing many addresses impractical.
  public static registerLimiter = RateLimiterMiddleware.createActionLimiter(
    "Too many registration attempts from this IP, please try again after 1 minute",
  );

  public static resendVerificationLimiter = RateLimiterMiddleware.createActionLimiter(
    "Too many verification email requests from this IP, please try again after 1 minute",
  );

  public static changePasswordLimiter = RateLimiterMiddleware.createActionLimiter(
    "Too many password change attempts from this IP, please try again after 1 minute",
  );

  public static resetPasswordLimiter = RateLimiterMiddleware.createActionLimiter(
    "Too many password reset attempts from this IP, please try again after 1 minute",
  );

  public static forgotPasswordLimiter = rateLimit(
    RateLimiterMiddleware.forgotPasswordLimiterConfig,
  );
}

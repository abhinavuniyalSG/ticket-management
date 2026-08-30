import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.utils.js";
import { logger } from "../core/logger.js";

export class ErrorMiddleware {
  public static middleware = (
    error: HttpError | Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message = error.message || "Internal Server Error";

    if (statusCode >= 500) {
      logger.error(message, {
        statusCode,
        method: req.method,
        path: req.path,
        stack: error.stack,
      });
    } else {
      logger.warn(message, {
        statusCode,
        method: req.method,
        path: req.path,
      });
    }

    res.status(statusCode).json({ message });
  };
}

import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.utils.js";
import { logger } from "../core/logger.js";

export class ErrorMiddleware {
  public static middleware = (
    error:
      | HttpError
      | (Error & {
          status?: number;
          statusCode?: number;
          type?: string;
        }),
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    ///for hanlding error at json parser error
    if (!(error instanceof HttpError) && error.type === "entity.parse.failed") {
      logger.warn("Invalid JSON body", {
        statusCode: 400,
        method: req.method,
        path: req.path,
      });

      return res.status(400).json({
        message: "Invalid JSON body",
      });
    }

    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message =
      statusCode >= 500
        ? "Internal Server Error"
        : error.message || "Bad Request";

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

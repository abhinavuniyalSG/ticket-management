import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.utils.js";

export class ErrorMiddleware {
  public static middleware = (
    error: HttpError | Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    let statusCode = 500;
    if (error instanceof HttpError) {
      statusCode = error.statusCode || 500;
    }
    const message = error.message || "Internal Server error";

    res.status(statusCode).json({ message });
  };
}

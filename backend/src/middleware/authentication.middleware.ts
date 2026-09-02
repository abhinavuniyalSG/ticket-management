import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_VARIABLES } from "../config/secrets.js";
import { HttpError } from "../utils/httpError.utils.js";
import type { TokenPayload } from "../types/jwtToken.type.js";
import { extractToken, verifyToken } from "../utils/auth.util.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req, "accessToken");

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    const decoded = verifyToken(
      token,
      JWT_VARIABLES.JWT_ACCESS_SECRET,
    ) as TokenPayload;

    if (
      !decoded?.id ||
      !decoded?.email ||
      !decoded?.role ||
      decoded?.typ !== "access"
    ) {
      throw new HttpError(401, "Invalid token payload");
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    next(new HttpError(500, "Internal authentication error"));
  }
};

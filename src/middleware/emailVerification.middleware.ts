import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.utils.js";
import { UserRepository } from "../database/repositry/user.repository.js";

export const requireVerifiedEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, "Unauthorized");
    }

    const user = await UserRepository.findById(req.user.id);

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!user.isVerified) {
      throw new HttpError(403, "Please verify your email first");
    }

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    next(new HttpError(500, "Internal server error"));
  }
};

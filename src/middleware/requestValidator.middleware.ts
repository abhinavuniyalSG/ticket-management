import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { logger } from "../core/logger.js";
type validateType = "body" | "params" | "query";

export class requestValidator {
  public static validate = (type: validateType, schema: z.ZodObject) => {
    return (req: Request, res: Response, next: NextFunction) => {
      let input: unknown;

      switch (type) {
        case "params":
          input = req.params;
          break;
        case "query":
          input = req.query;
          break;
        case "body":
          input = req.body;
          break;
      }
      const result = schema.safeParse(input);

      if (!result.success) {
        logger.warn("Request validation failed", {
          method: req.method,
          path: req.path,
          type,
          errors: result.error.issues.map((issue) => issue.message),
        });
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.issues.map((issues) => issues.message),
        });
      }

      req.normalized = { ...req.normalized, [type]: result.data };
      logger.debug(`Request ${type} validated`, {
        method: req.method,
        path: req.path,
        normalizedInput: req.normalized,
      });
      next();
    };
  };
}

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
        const issueMessages = result.error.issues.map((issue) => issue.message);

        logger.warn("Request validation failed", {
          method: req.method,
          path: req.path,
          type,
          errors: issueMessages,
        });
        // `message` stays a fixed, generic label; the specific per-field
        // reasons live only in `errors`, so callers don't get them smashed
        // together into one run-on, unpunctuated sentence.
        return res.status(400).json({
          message: "Validation failed",
          errors: issueMessages,
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

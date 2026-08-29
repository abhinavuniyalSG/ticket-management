import morgan from "morgan";
import { logger } from "../core/logger.js";

export class RequestLoggerMiddleware {
  private static format: string =
    ":method :url :status :res[content-length] - :response-time ms";
  private static option = {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  };
  public static requestLogger = morgan(
    RequestLoggerMiddleware.format,
    RequestLoggerMiddleware.option,
  );
}

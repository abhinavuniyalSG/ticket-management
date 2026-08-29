import type { Application } from "express";
import express from "express";
import cors from "cors";
import { DatabaseConnection } from "../database/dbConnection.js";
import { ErrorMiddleware } from "../middleware/errorHandling.middleware.js";
import { RequestLoggerMiddleware } from "../middleware/requestLogger.middleware.js";

export class Kernel {
  private errorHandlingMiddleware = ErrorMiddleware.middleware;
  private margonHttpLogger = RequestLoggerMiddleware.requestLogger;
  private database = DatabaseConnection;
  public toJsonParser = (app: Application) => {
    return app.use(express.json());
  };
  public preFlight = (app: Application) => {
    return app.use(cors());
  };
  public dbConnect = async () => {
    return await this.database.connectDB();
  };

  public errorMiddleware = (app: Application) => {
    return app.use(this.errorHandlingMiddleware);
  };
  public httpLogger = (app: express.Application) => {
    app.use(this.margonHttpLogger);
  };
}

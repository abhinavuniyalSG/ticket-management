import type { Application } from "express";
import express from "express";
import cors from "cors";
import { DatabaseConnection } from "../database/dbConnection.js";

export class Kernel {
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
}

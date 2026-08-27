import type { Application } from "express";
import express from "express";
import cors from "cors";

export class Kernel {
  public toJsonParser = (app: Application) => {
    app.use(express.json());
  };
  public preFlight = (app: Application) => {
    app.use(cors());
  };
}

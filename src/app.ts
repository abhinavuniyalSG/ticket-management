import express from "express";
import { logger } from "./core/logger.js";
import { Kernel } from "./core/kernel.js";
import Routes from "./routes/index.js";

class App {
  public app = express();
  private kernel = new Kernel();
  private appRouter = new Routes();

  private initlaize = async () => {
    await this.kernel.dbConnect();
    this.kernel.toJsonParser(this.app);
    this.kernel.preFlight(this.app);
    this.kernel.httpLogger(this.app);
    this.appRouter.routes(this.app);
    this.kernel.errorMiddleware(this.app);
  };
  constructor() {
    this.initlaize().catch((e) => {
      logger.error("encounter error  while initlaize", { error: e });
      logger.info("Closing server");
      process.exit(1);
    });
  }
}
export default new App().app;

import express from "express";
import { logger } from "./core/logger.js";
import { Kernel } from "./core/kernel.js";
import Routes from "./routes/index.js";
import { registerSwagger } from "./docs/swagger.js";

class App {
  public app = express();
  public ready: Promise<void>;
  private kernel = new Kernel();
  private appRouter = new Routes();

  private initlaize = async () => {
    await this.kernel.dbConnect();
    this.kernel.toJsonParser(this.app);
    this.kernel.cookieParser(this.app);
    this.kernel.requestLimiter(this.app);
    this.kernel.preFlight(this.app);
    this.kernel.httpLogger(this.app);
    registerSwagger(this.app);
    this.appRouter.routes(this.app);
    this.kernel.errorMiddleware(this.app);
  };
  constructor() {
    this.ready = this.initlaize().catch((e) => {
      logger.error(
        "Fatal error during application initialization — shutting down",
        { error: e },
      );
      process.exit(1);
    });
  }
}
const appInstance = new App();
export const appReady = appInstance.ready;
export default appInstance.app;

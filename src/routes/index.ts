import type { Application } from "express";
import authenticationRoutes from "./authentication.routes.js";
class Routes {
  public routes(app: Application): void {
    app.use("/api/auth", authenticationRoutes);
  }
}
export default Routes;

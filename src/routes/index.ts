import type { Application } from "express";
import authenticationRoutes from "./authentication.routes.js";
import userRoutes from "./user.routes.js";

class Routes {
  public routes(app: Application): void {
    app.use("/api/auth", authenticationRoutes);
    app.use("/api/users", userRoutes);
  }
}
export default Routes;

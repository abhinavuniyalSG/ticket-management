import type { Application } from "express";
import authenticationRoutes from "./authentication.routes.js";
import userRoutes from "./user.routes.js";
import departmentRoutes from "./department.routes.js";

class Routes {
  public routes(app: Application): void {
    app.use("/api/auth", authenticationRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/departments", departmentRoutes);
  }
}
export default Routes;

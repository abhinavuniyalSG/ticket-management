import type { Application } from "express";
import authenticationRoutes from "./authentication.routes.js";
import userRoutes from "./user.routes.js";
import departmentRoutes from "./department.routes.js";
import ticketRoutes from "./ticket.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

class Routes {
  public routes(app: Application): void {
    app.use("/api/auth", authenticationRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/departments", departmentRoutes);
    app.use("/api/tickets", ticketRoutes);
    app.use("/api/dashboard", dashboardRoutes);
  }
}
export default Routes;


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import statusRoutes from "./routes/status.routes.js";
import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import db from "./config/db.js";
import { isAdmin, jwtAuthenticate } from "./middleware/auth.middleware.js";
import { notFoundMiddleWare } from "./middleware/notFound.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/status", statusRoutes);
app.use("/auth", authRoutes);
app.use("/ticket", jwtAuthenticate, ticketRoutes);
app.use("/user", jwtAuthenticate, userRoutes);
app.use("/admin", jwtAuthenticate, isAdmin, adminRoutes);
app.use("/department", jwtAuthenticate, departmentRoutes);
app.use(notFoundMiddleWare);
app.use(errorMiddleware);

app.listen(port, async () => {
  try {
    console.log("server is running");
    console.log(port);
    await db.query("select 1");
  } catch (e) {
    console.error(e);
  }
});
const fullShutdown = async () => {
  try {
    console.log("closing pool");
    await db.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    throw error;
    process.exit(1);
  }
};

process.on("SIGINT", () => fullShutdown("SIGINT"));

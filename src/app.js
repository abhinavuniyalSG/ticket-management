import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import serverStatus from "./routes/status.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/status", serverStatus);
app.use((req, res) => {
  res.status(404).end("Not a valid request ");
});
app.listen(port, () => {
  console.log("server is running");
  console.log(port);
});

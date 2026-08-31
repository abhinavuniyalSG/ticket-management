import app from "./app.js";
import { PORT } from "./config/secrets.js";
import { logger } from "./core/logger.js";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception! Shutting down...", { error: err });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection! Shutting down...", { error: err });
  process.exit(1);
});


app.listen(PORT, () => {
  logger.info(`Server is running on port:${PORT} `);
});

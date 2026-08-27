import app from "./app.js";
import { PORT } from "./config/secrets.js";
import { logger } from "./core/logger.js";

app.listen(PORT, () => {
  logger.info(`Server is running on port:${PORT} `);
});

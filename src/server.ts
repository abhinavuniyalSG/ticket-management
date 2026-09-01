import app, { appReady } from "./app.js";
import { PORT } from "./config/secrets.js";
import { logger } from "./core/logger.js";
import { NotificationService } from "./services/notification.service.js";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception! Shutting down...", { error: err });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection! Shutting down...", { error: err });
  process.exit(1);
});

void appReady.then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port:${PORT} `);
    void NotificationService.sendSuperAdminSummary().catch((error) =>
      logger.error("Failed to create startup ticket summary", { error }),
    ); // send the admin summary on server startup
    setInterval(
      () => void NotificationService.sendDepartmentReminders(),
      3 * 60 * 60 * 1000,
    ); //set interval to send department admin reminders every 3 hours
    const now = new Date(); //find current date
    const nextFivePm = new Date(now); // make a copy
    nextFivePm.setHours(17, 0, 0, 0); //set time to 5pm
    if (nextFivePm <= now) nextFivePm.setDate(nextFivePm.getDate() + 1); //check the now is more than 5pm  if yes then set the date to next day
    //create a settimeout to first send the summary at 5pm and then set an interval to send the summary every 24 hours
    setTimeout(() => {
      void NotificationService.sendSuperAdminSummary();
      setInterval(
        () => void NotificationService.sendSuperAdminSummary(),
        24 * 60 * 60 * 1000,
      );
    }, nextFivePm.getTime() - now.getTime());
  });
});

import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { seedDemoNotifications } from "./seed/demoNotifications.js";
import { logger } from "./utils/logger.js";

const app = createApp();
seedDemoNotifications();

app.listen(env.port, () => {
  logger.info(`Notification service on ${env.port}`);
});

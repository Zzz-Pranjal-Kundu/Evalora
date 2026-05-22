import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { seedDemoFeedback } from "./seed/seedDemo.js";

const app = createApp();
await seedDemoFeedback();

app.listen(env.port, () => {
  logger.info(`Feedback service listening on ${env.port}`);
});

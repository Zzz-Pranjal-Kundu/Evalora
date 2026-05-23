import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { seedDemoEvents } from "./seed/seedDemo.js";

const app = createApp();
await seedDemoEvents();

app.listen(env.port, () => {
  logger.info(`Analytics service listening on ${env.port}`);
});

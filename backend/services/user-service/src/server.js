import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { seedDemoProfiles } from "./seed/demoProfiles.js";
import { logger } from "./utils/logger.js";

const app = createApp();
seedDemoProfiles();

app.listen(env.port, () => {
  logger.info(`User service listening on port ${env.port}`);
});

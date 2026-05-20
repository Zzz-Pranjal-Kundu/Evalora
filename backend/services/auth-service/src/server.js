import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { seedDemoUsers } from "./seed/demoUsers.js";
import { logger } from "./utils/logger.js";

const app = createApp();

await seedDemoUsers();

app.listen(env.port, () => {
  logger.info(`Auth service listening on port ${env.port}`);
});

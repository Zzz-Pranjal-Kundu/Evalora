import "./db/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { seedDemoReviews, seedIfEmpty } from "./seed/seedDemo.js";

const app = createApp();

await seedIfEmpty();
await seedDemoReviews();

app.listen(env.port, () => {
  logger.info(`Performance review service listening on ${env.port}`);
});

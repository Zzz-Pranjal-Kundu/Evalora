import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = createApp();

app.listen(env.port, () => {
  logger.info(`AI insights service listening on ${env.port}`);
});

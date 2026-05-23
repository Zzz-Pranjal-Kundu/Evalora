import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const uri = env.mongodbUri;

mongoose.connect(uri)
  .then(() => logger.info("Auth database connected successfully via Mongoose"))
  .catch(err => logger.error("Auth database connection failed", err));

export const db = mongoose.connection;

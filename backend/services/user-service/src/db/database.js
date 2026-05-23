import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const uri = env.mongodbUri;

mongoose.connect(uri)
  .then(() => logger.info("User database connected successfully via Mongoose"))
  .catch(err => logger.error("User database connection failed", err));

export const db = mongoose.connection;

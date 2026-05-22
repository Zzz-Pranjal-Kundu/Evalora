import { prisma } from "@epfms/database";
import { logger } from "../utils/logger.js";

export const db = prisma;

logger.info("Feedback database initialized", { driver: "prisma:postgresql" });

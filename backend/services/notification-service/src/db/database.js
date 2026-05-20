import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const resolvedPath = path.isAbsolute(env.databasePath)
  ? env.databasePath
  : path.resolve(process.cwd(), env.databasePath);

ensureDir(resolvedPath);

/** @type {import('node:sqlite').DatabaseSync} */
export const db = new DatabaseSync(resolvedPath);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`);

logger.info("Notification database ready", { path: resolvedPath, driver: "node:sqlite" });

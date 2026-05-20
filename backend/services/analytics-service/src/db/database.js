import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
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

export const db = new DatabaseSync(resolvedPath);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    received_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS metric_snapshots (
    id TEXT PRIMARY KEY,
    metric_key TEXT NOT NULL,
    dimensions_json TEXT NOT NULL,
    value REAL NOT NULL,
    recorded_at TEXT NOT NULL
  );
`);

logger.info("Analytics DB ready", { path: resolvedPath });

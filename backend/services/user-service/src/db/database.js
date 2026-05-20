import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const resolvedPath = path.isAbsolute(env.databasePath)
  ? env.databasePath
  : path.resolve(process.cwd(), env.databasePath);

ensureDir(resolvedPath);

/** @type {import('node:sqlite').DatabaseSync} */
export const db = new DatabaseSync(resolvedPath);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    department TEXT,
    job_title TEXT,
    manager_id TEXT,
    preferences_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const profileCols = db.prepare("PRAGMA table_info(profiles)").all();
if (!profileCols.some((c) => c.name === "team")) {
  db.exec("ALTER TABLE profiles ADD COLUMN team TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS recognitions (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT,
    value_tag TEXT NOT NULL,
    message TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'org_feed',
    created_at TEXT NOT NULL
  );
`);

const recognitionCols = db.prepare("PRAGMA table_info(recognitions)").all();
if (!recognitionCols.some((c) => c.name === "visibility")) {
  db.exec("ALTER TABLE recognitions ADD COLUMN visibility TEXT NOT NULL DEFAULT 'org_feed'");
}

logger.info("User database initialized", { path: resolvedPath, driver: "node:sqlite" });

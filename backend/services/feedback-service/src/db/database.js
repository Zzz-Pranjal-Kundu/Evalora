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
  CREATE TABLE IF NOT EXISTS feedback_requests (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    status TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'with_managers',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS feedback_entries (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES feedback_requests(id)
  );
`);

const feedbackReqCols = db.prepare("PRAGMA table_info(feedback_requests)").all();
if (!feedbackReqCols.some((c) => c.name === "visibility")) {
  db.exec("ALTER TABLE feedback_requests ADD COLUMN visibility TEXT NOT NULL DEFAULT 'with_managers'");
}

logger.info("Feedback DB ready", { path: resolvedPath });

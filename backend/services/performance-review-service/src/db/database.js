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
  CREATE TABLE IF NOT EXISTS review_cycles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    cycle_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    rating REAL,
    summary TEXT,
    visibility TEXT NOT NULL DEFAULT 'participants_only',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (cycle_id) REFERENCES review_cycles(id)
  );
`);

const reviewCols = db.prepare("PRAGMA table_info(reviews)").all();
if (!reviewCols.some((c) => c.name === "visibility")) {
  db.exec("ALTER TABLE reviews ADD COLUMN visibility TEXT NOT NULL DEFAULT 'participants_only'");
}

logger.info("Performance DB ready", { path: resolvedPath });

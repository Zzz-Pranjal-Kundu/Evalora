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
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
`);

/** Relax legacy CHECK(role) constraint so RBAC roles can be stored. */
function migrateUsersRoleConstraint() {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!row?.sql || !String(row.sql).includes("CHECK(role IN")) return;
  db.exec(`
    CREATE TABLE users__rbac (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO users__rbac SELECT id, email, password_hash, role, created_at, updated_at FROM users;
    DROP TABLE users;
    ALTER TABLE users__rbac RENAME TO users;
  `);
}

migrateUsersRoleConstraint();

logger.info("Auth database initialized", { path: resolvedPath, driver: "node:sqlite" });

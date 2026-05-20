import { randomUUID } from "crypto";
import { db } from "../db/database.js";

/**
 * Data access layer for users (MVC Model).
 */
export class UserModel {
  static findByEmail(email) {
    const row = db
      .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email);
    return row ?? null;
  }

  static findById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) ?? null;
  }

  static create({ email, passwordHash, role }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, email, passwordHash, role, now, now);
    return UserModel.findById(id);
  }

  /** Used by demo seed so downstream SQLite services can reference fixed user IDs. */
  static createWithId({ id, email, passwordHash, role }) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, email, passwordHash, role, now, now);
    return UserModel.findById(id);
  }

  static updateRole(id, role) {
    const now = new Date().toISOString();
    const res = db
      .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
      .run(role, now, id);
    return res.changes > 0 ? UserModel.findById(id) : null;
  }

  static updatePasswordHash(id, passwordHash) {
    const now = new Date().toISOString();
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(passwordHash, now, id);
    return UserModel.findById(id);
  }
}

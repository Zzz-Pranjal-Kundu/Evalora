import { createHmac, randomBytes, randomUUID } from "crypto";
import { db } from "../db/database.js";
import { env } from "../config/env.js";

function hashToken(plain) {
  return createHmac("sha256", env.jwtSecret).update(plain).digest("hex");
}

function refreshTtlMs() {
  const s = env.jwtRefreshExpiresIn || "7d";
  const m = /^(\d+)([dhm])$/i.exec(String(s).trim());
  if (!m) return 7 * 86400000;
  const n = parseInt(m[1], 10);
  const mult = m[2].toLowerCase() === "d" ? 86400000 : m[2].toLowerCase() === "h" ? 3600000 : 60000;
  return n * mult;
}

export class RefreshTokenModel {
  /**
   * @returns {{ plain: string }}
   */
  static issue(userId) {
    const plain = randomBytes(40).toString("base64url");
    const id = randomUUID();
    const now = new Date().toISOString();
    const exp = new Date(Date.now() + refreshTtlMs()).toISOString();
    db.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, hashToken(plain), exp, now);
    return { plain };
  }

  static findValidUserId(plain) {
    if (!plain) return null;
    const h = hashToken(plain);
    const now = new Date().toISOString();
    const row = db
      .prepare(`SELECT user_id FROM refresh_tokens WHERE token_hash = ? AND expires_at > ?`)
      .get(h, now);
    return row?.user_id ?? null;
  }

  static revokeByPlain(plain) {
    if (!plain) return;
    const h = hashToken(plain);
    db.prepare(`DELETE FROM refresh_tokens WHERE token_hash = ?`).run(h);
  }

  static revokeAllForUser(userId) {
    db.prepare(`DELETE FROM refresh_tokens WHERE user_id = ?`).run(userId);
  }
}

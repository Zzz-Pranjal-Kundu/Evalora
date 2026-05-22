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
   * @returns {Promise<{ plain: string }>}
   */
  static async issue(userId) {
    const plain = randomBytes(40).toString("base64url");
    const id = randomUUID();
    const exp = new Date(Date.now() + refreshTtlMs());
    await db.refreshToken.create({
      data: {
        id,
        userId,
        tokenHash: hashToken(plain),
        expiresAt: exp
      }
    });
    return { plain };
  }

  static async findValidUserId(plain) {
    if (!plain) return null;
    const h = hashToken(plain);
    const row = await db.refreshToken.findFirst({
      where: {
        tokenHash: h,
        expiresAt: { gt: new Date() }
      }
    });
    return row?.userId ?? null;
  }

  static async revokeByPlain(plain) {
    if (!plain) return;
    const h = hashToken(plain);
    await db.refreshToken.deleteMany({
      where: { tokenHash: h }
    });
  }

  static async revokeAllForUser(userId) {
    await db.refreshToken.deleteMany({
      where: { userId }
    });
  }
}

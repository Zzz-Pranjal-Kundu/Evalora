import mongoose from "mongoose";
import { createHmac, randomBytes, randomUUID } from "crypto";
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

const RefreshTokenSchema = new mongoose.Schema({
  _id: { type: String, default: randomUUID },
  user_id: { type: String, required: true },
  token_hash: { type: String, required: true },
  expires_at: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  _id: false
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema, "refresh_tokens");

export class RefreshTokenModel {
  static async issue(userId) {
    const plain = randomBytes(40).toString("base64url");
    const id = randomUUID();
    const now = new Date().toISOString();
    const exp = new Date(Date.now() + refreshTtlMs()).toISOString();
    
    await RefreshToken.create({
      _id: id,
      user_id: userId,
      token_hash: hashToken(plain),
      expires_at: exp,
      created_at: now
    });
    
    return { plain };
  }

  static async findValidUserId(plain) {
    if (!plain) return null;
    const h = hashToken(plain);
    const now = new Date().toISOString();
    const row = await RefreshToken.findOne({
      token_hash: h,
      expires_at: { $gt: now }
    }).lean();
    return row?.user_id ?? null;
  }

  static async revokeByPlain(plain) {
    if (!plain) return;
    const h = hashToken(plain);
    await RefreshToken.deleteOne({ token_hash: h });
  }

  static async revokeAllForUser(userId) {
    await RefreshToken.deleteMany({ user_id: userId });
  }
}

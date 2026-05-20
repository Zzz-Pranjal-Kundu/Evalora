import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeUserId(userId) {
  if (userId == null) return null;
  const s = String(userId).trim();
  return s.length ? s : null;
}

export async function sendNotification(userId, title, body) {
  const uid = normalizeUserId(userId);
  if (!uid) {
    logger.warn("Notification skipped: missing userId");
    return;
  }
  const url = `${env.notificationServiceUrl.replace(/\/$/, "")}/internal/notify`;
  const payload = JSON.stringify({
    userId: uid,
    title: String(title ?? "").trim(),
    body: String(body ?? "").trim(),
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": env.internalKey,
        },
        body: payload,
      });
      if (r.ok) return;
      const text = await r.text().catch(() => "");
      const retryable = r.status >= 500 || r.status === 429;
      if (retryable && attempt < 2) {
        await delay(80 * 2 ** attempt);
        continue;
      }
      logger.warn("Notification upstream error", { status: r.status, text });
      return;
    } catch (e) {
      if (attempt < 2) {
        await delay(80 * 2 ** attempt);
        continue;
      }
      logger.warn("Notification call failed", { message: e?.message || String(e) });
    }
  }
}

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function recordEvent(eventType, payload) {
  const url = `${env.analyticsServiceUrl.replace(/\/$/, "")}/internal/events`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": env.internalKey,
      },
      body: JSON.stringify({ eventType, payload }),
    });
  } catch (e) {
    logger.debug?.("analytics fire-and-forget failed", { message: e?.message });
  }
}

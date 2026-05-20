import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const headers = () => ({
  "X-Internal-Key": env.internalKey,
});

export async function fetchProfile(userId) {
  const base = env.userServiceUrl.replace(/\/$/, "");
  const url = `${base}/internal/profiles/${userId}`;
  try {
    const r = await fetch(url, { headers: headers() });
    if (r.status === 404) return null;
    if (!r.ok) {
      logger.warn("User service profile error", { status: r.status });
      return null;
    }
    return await r.json();
  } catch (e) {
    logger.warn("User service profile failed", { message: e?.message });
    return null;
  }
}

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const headers = () => ({
  "X-Internal-Key": env.internalKey,
});

export async function fetchProfile(userId) {
  const url = `${env.userServiceUrl.replace(/\/$/, "")}/internal/profiles/${userId}`;
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

export async function fetchReportUserIds(managerId) {
  const url = `${env.userServiceUrl.replace(/\/$/, "")}/internal/profiles/by-manager/${managerId}`;
  try {
    const r = await fetch(url, { headers: headers() });
    if (!r.ok) {
      logger.warn("User service reports error", { status: r.status });
      return [];
    }
    const data = await r.json();
    const ids = data?.userIds;
    return Array.isArray(ids) ? ids : [];
  } catch (e) {
    logger.warn("User service reports failed", { message: e?.message });
    return [];
  }
}

export async function displayName(userId) {
  const p = await fetchProfile(userId);
  return p?.fullName || "Colleague";
}

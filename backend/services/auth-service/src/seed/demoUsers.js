import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.js";
import { logger } from "../utils/logger.js";
import { loadOrgSeed } from "./loadOrgJson.js";

export const DEMO_PASSWORD = "Demo12345!";

/**
 * Idempotent org seed from `backend/database/demo_org_seed.json`.
 * For each JSON user: creates the row if missing (by email). If a row exists with the same **id**
 * as the seed, refreshes password hash and role from JSON so passwords match the file after edits.
 * Skips rows when the email is already used by a different id (e.g. self-registered account).
 */
export async function seedDemoUsers() {
  const org = loadOrgSeed();
  if (!org?.users?.length) {
    logger.warn("No demo_org_seed.json found — skipping org demo users");
    return;
  }
  const fallback = org.defaultPassword || DEMO_PASSWORD;
  let created = 0;
  let refreshed = 0;
  let skipped = 0;

  for (const row of org.users) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email || !row.id) continue;
    const plain = row.password ?? fallback;
    const passwordHash = await bcrypt.hash(plain, 12);
    const existing = UserModel.findByEmail(email);

    if (!existing) {
      UserModel.createWithId({
        id: row.id,
        email,
        passwordHash,
        role: row.role,
      });
      created += 1;
      logger.info("Seeded org user", { email, role: row.role });
      continue;
    }

    if (existing.id === row.id) {
      UserModel.updatePasswordHash(row.id, passwordHash);
      if (existing.role !== row.role) {
        UserModel.updateRole(row.id, row.role);
      }
      refreshed += 1;
      continue;
    }

    skipped += 1;
    logger.warn("Org seed skipped for email (different account id)", {
      email,
      seedId: row.id,
      existingId: existing.id,
    });
  }

  if (created || refreshed || skipped) {
    logger.info("Demo org sync finished", { created, refreshed, skipped });
  }
}

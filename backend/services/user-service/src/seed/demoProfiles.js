import { ProfileModel } from "../models/ProfileModel.js";
import { logger } from "../utils/logger.js";
import { loadOrgSeed } from "./loadOrgJson.js";

function fullNameFromSeedRow(row) {
  if (row.fullName && String(row.fullName).trim()) return String(row.fullName).trim();
  const parts = [row.firstName, row.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ").trim();
  if (row.email) return String(row.email).split("@")[0].replace(/\./g, " ");
  return "Demo user";
}

function teamNameForUser(org, userId) {
  if (!org?.teams?.length || !userId) return null;
  for (const t of org.teams) {
    const members = t.memberUserIds || [];
    if (members.includes(userId)) return t.name || null;
    if (t.leadUserId === userId) return t.name || null;
  }
  return null;
}

/** Idempotent: creates profiles from backend/database/demo_org_seed.json when missing. */
export function seedDemoProfiles() {
  const org = loadOrgSeed();
  if (!org?.users?.length) {
    return;
  }
  let added = 0;
  for (const row of org.users) {
    if (ProfileModel.findByUserId(row.id)) continue;
    ProfileModel.create({
      userId: row.id,
      fullName: fullNameFromSeedRow(row),
      department: row.department ?? null,
      jobTitle: row.jobTitle ?? row.title ?? null,
      managerId: row.managerId ?? null,
      team: row.team ?? teamNameForUser(org, row.id),
    });
    added += 1;
  }
  if (added) {
    logger.info(`Seeded ${added} org profile(s) for directory / dashboards`);
  }
}

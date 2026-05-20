import { ProfileModel } from "../models/ProfileModel.js";
import { directoryEntryFromRow, profileFromRow } from "../views/profileView.js";
import { loadOrgSeed } from "../seed/loadOrgJson.js";

/** When `demo_org_seed.json` lists users, directory/org APIs only expose those ids (avoids orphan profiles). */
function demoOrgUserIdSet() {
  const org = loadOrgSeed();
  const users = org?.users;
  if (!Array.isArray(users) || users.length === 0) return null;
  const ids = users.map((u) => u?.id).filter(Boolean);
  return ids.length ? new Set(ids) : null;
}

function filterProfileRowsToDemoOrg(rows) {
  const allow = demoOrgUserIdSet();
  if (!allow) return rows;
  return rows.filter((row) => allow.has(row.user_id));
}

export class ProfileService {
  static createInternal({ userId, fullName, department, jobTitle, managerId, team }) {
    const existing = ProfileModel.findByUserId(userId);
    if (existing) {
      const err = new Error("Profile already exists");
      err.statusCode = 409;
      throw err;
    }
    const row = ProfileModel.create({
      userId,
      fullName: fullName || "New User",
      department,
      jobTitle,
      managerId,
      team,
    });
    return profileFromRow(row);
  }

  static getMe(userId) {
    const row = ProfileModel.findByUserId(userId);
    if (!row) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }
    return profileFromRow(row);
  }

  static updateMe(userId, body) {
    const row = ProfileModel.findByUserId(userId);
    if (!row) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }
    const updated = ProfileModel.update(userId, {
      fullName: body.fullName,
      department: body.department,
      jobTitle: body.jobTitle,
      team: body.team,
      preferences: body.preferences,
    });
    return profileFromRow(updated);
  }

  static setManager(targetUserId, managerId, actorRoles) {
    const privileged = ["ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"];
    if (!actorRoles.some((r) => privileged.includes(r))) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    const row = ProfileModel.findByUserId(targetUserId);
    if (!row) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }
    const updated = ProfileModel.update(targetUserId, { managerId });
    return profileFromRow(updated);
  }

  static listProfiles(actorRoles) {
    const privileged = ["ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"];
    if (!actorRoles.some((r) => privileged.includes(r))) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    return filterProfileRowsToDemoOrg(ProfileModel.findAll()).map((r) => profileFromRow(r));
  }

  /**
   * Minimal directory for all authenticated users (pick colleagues for feedback, etc.).
   */
  static listDirectory(actorId) {
    return filterProfileRowsToDemoOrg(ProfileModel.findAll())
      .filter((row) => row.user_id !== actorId)
      .map((r) => directoryEntryFromRow(r));
  }

  /** Service-to-service: minimal profile for feedback routing / notifications. */
  static getInternalByUserId(userId) {
    const row = ProfileModel.findByUserId(userId);
    if (!row) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }
    return profileFromRow(row);
  }

  static listReportUserIds(managerId) {
    const ids = ProfileModel.listUserIdsByManagerId(managerId);
    const allow = demoOrgUserIdSet();
    if (!allow) return ids;
    return ids.filter((id) => allow.has(id));
  }
}

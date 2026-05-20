import { db } from "../db/database.js";

export class ProfileModel {
  static findByUserId(userId) {
    return db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId) ?? null;
  }

  static findAll() {
    return db.prepare("SELECT * FROM profiles ORDER BY full_name").all();
  }

  /** Direct reports only (for manager visibility in downstream services). */
  static listUserIdsByManagerId(managerId) {
    if (!managerId) return [];
    return db
      .prepare("SELECT user_id FROM profiles WHERE manager_id = ?")
      .all(managerId)
      .map((r) => r.user_id);
  }

  static create({ userId, fullName, department, jobTitle, managerId, team, preferences }) {
    const now = new Date().toISOString();
    const prefs = preferences ? JSON.stringify(preferences) : null;
    db.prepare(
      `INSERT INTO profiles (user_id, full_name, department, job_title, manager_id, team, preferences_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      fullName,
      department || null,
      jobTitle || null,
      managerId || null,
      team || null,
      prefs,
      now,
      now
    );
    return ProfileModel.findByUserId(userId);
  }

  static update(userId, fields) {
    const existing = ProfileModel.findByUserId(userId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const fullName = fields.fullName ?? existing.full_name;
    const department = fields.department ?? existing.department;
    const jobTitle = fields.jobTitle ?? existing.job_title;
    const managerId =
      fields.managerId !== undefined ? fields.managerId : existing.manager_id;
    const team = fields.team !== undefined ? fields.team : (existing.team ?? null);
    let preferencesJson = existing.preferences_json;
    if (fields.preferences !== undefined) {
      preferencesJson = JSON.stringify(fields.preferences);
    }
    db.prepare(
      `UPDATE profiles SET full_name = ?, department = ?, job_title = ?, manager_id = ?, team = ?, preferences_json = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(fullName, department, jobTitle, managerId, team, preferencesJson, now, userId);
    return ProfileModel.findByUserId(userId);
  }
}

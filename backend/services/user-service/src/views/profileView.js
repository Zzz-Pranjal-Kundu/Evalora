/**
 * MVC View: profile and directory JSON exposed by the API.
 */
export function profileFromRow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    fullName: row.full_name,
    department: row.department,
    jobTitle: row.job_title,
    managerId: row.manager_id,
    team: row.team ?? null,
    preferences: row.preferences_json ? JSON.parse(row.preferences_json) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function directoryEntryFromRow(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    department: row.department,
    jobTitle: row.job_title,
    team: row.team ?? null,
    managerId: row.manager_id ?? null,
  };
}

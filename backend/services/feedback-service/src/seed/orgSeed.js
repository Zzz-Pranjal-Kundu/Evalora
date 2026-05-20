import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolves the `backend/` folder (contains `services/`, `database/`, `data/`). */
export function repoRoot() {
  return path.resolve(__dirname, "..", "..", "..", "..");
}

export function loadOrg() {
  const p = path.join(repoRoot(), "database", "demo_org_seed.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

export function userIdByEmail(org, email) {
  if (!org?.users) return null;
  const row = org.users.find((u) => u.email === email);
  return row?.id ?? null;
}

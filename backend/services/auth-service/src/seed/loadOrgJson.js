import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `backend/database/demo_org_seed.json` (resolved from this file; cwd-independent). */
export function orgSeedJsonPath() {
  return path.resolve(__dirname, "../../../../database/demo_org_seed.json");
}

export function loadOrgSeed() {
  const p = orgSeedJsonPath();
  if (!fs.existsSync(p)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

import { NotificationModel } from "../models/NotificationModel.js";
import { db } from "../db/database.js";
import { logger } from "../utils/logger.js";
import { loadOrgSeed } from "./loadOrgJson.js";

const TEMPLATES = [
  {
    title: "360 feedback reminder",
    body: "You have open feedback requests. Nudge raters before the cycle checkpoint so calibration has full context.",
  },
  {
    title: "Team goal checkpoint",
    body: "Mid-cycle: review SMART goal progress for your direct reports and log themes in check-ins.",
  },
  {
    title: "HR calibration prep",
    body: "Distribution preview for your org unit will be available next week—review competency evidence early.",
  },
];

export function seedDemoNotifications() {
  const org = loadOrgSeed();
  const emails = org?.demoData?.notificationsForEmails?.length
    ? org.demoData.notificationsForEmails
    : ["liam.park@epfms.demo", "maya.singh@epfms.demo", "jordan.cs@epfms.demo"];

  const emailToId = new Map((org?.users || []).map((u) => [u.email, u.id]));

  for (const email of emails) {
    const userId = emailToId.get(email);
    if (!userId) continue;
    const row = db.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ?").get(userId);
    if (row && row.c > 0) continue;
    for (const it of TEMPLATES) {
      NotificationModel.create({ userId, title: it.title, body: it.body });
    }
    logger.info("Seeded demo notifications", { userId, email });
  }
}

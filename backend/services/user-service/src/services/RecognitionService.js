import { randomUUID } from "node:crypto";
import { RecognitionModel } from "../models/RecognitionModel.js";
import { ProfileModel } from "../models/ProfileModel.js";
import { notifyUserInternal } from "./notifyInternal.js";

const PRIV = new Set(["ADMIN", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"]);

function rowToDto(row) {
  return {
    id: row.id,
    at: row.created_at,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id || null,
    valueTag: row.value_tag,
    message: row.message,
    visibility: row.visibility || "org_feed",
  };
}

function normalizeRecognitionVisibility(raw) {
  if (typeof raw === "string" && raw.trim() === "sender_recipient_only") return "sender_recipient_only";
  return "org_feed";
}

function canSeeRecognitionRow(row, viewerId, roles) {
  const r = roles || [];
  if (r.some((x) => PRIV.has(x))) return true;
  const vis = row.visibility || "org_feed";
  if (vis === "org_feed") return true;
  return row.from_user_id === viewerId || row.to_user_id === viewerId;
}

export class RecognitionService {
  static async listFeedForViewer(viewerId, roles, limit = 200) {
    const list = await RecognitionModel.listFeed(limit);
    return list
      .filter((row) => canSeeRecognitionRow(row, viewerId, roles))
      .map(rowToDto);
  }

  /**
   * @param {string} fromUserId
   * @param {{ toUserId?: string | null, valueTag: string, message: string, visibility?: string }} body
   */
  static async create(fromUserId, body) {
    const message = (body.message || "").trim();
    if (!message) {
      const err = new Error("Message is required");
      err.statusCode = 400;
      throw err;
    }
    const valueTag = (body.valueTag || "Excellence").trim();
    let toUserId = body.toUserId?.trim() || null;
    if (toUserId === "") toUserId = null;

    if (toUserId && toUserId === fromUserId) {
      const err = new Error("Cannot recognize yourself");
      err.statusCode = 400;
      throw err;
    }
    if (toUserId) {
      const target = await ProfileModel.findByUserId(toUserId);
      if (!target) {
        const err = new Error("Recipient profile not found");
        err.statusCode = 400;
        throw err;
      }
    }

    const visibility = normalizeRecognitionVisibility(body?.visibility);

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const row = await RecognitionModel.insert({
      id,
      fromUserId,
      toUserId,
      valueTag,
      message,
      createdAt,
      visibility,
    });

    if (toUserId) {
      const fromProfile = await ProfileModel.findByUserId(fromUserId);
      const fromName = fromProfile?.full_name || "A colleague";
      const preview = message.length > 160 ? `${message.slice(0, 157)}…` : message;
      await notifyUserInternal(
        toUserId,
        "You received recognition",
        `${fromName} highlighted "${valueTag}": ${preview}`
      );
    }

    return rowToDto(row);
  }
}

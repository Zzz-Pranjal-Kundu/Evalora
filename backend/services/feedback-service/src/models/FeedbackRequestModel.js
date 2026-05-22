import { db } from "../db/database.js";

function mapRequest(req) {
  if (!req) return null;
  return {
    id: req.id,
    from_user_id: req.fromUserId,
    to_user_id: req.toUserId,
    topic: req.topic,
    status: req.status,
    visibility: req.visibility,
    created_at: req.createdAt.toISOString()
  };
}

export async function findAllOrdered() {
  const list = await db.feedbackRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return list.map(mapRequest);
}

export async function findWhereOr(parts, params) {
  const userId = params[0];
  const list = await db.feedbackRequest.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
  return list.map(mapRequest);
}

export async function findById(requestId) {
  if (!requestId) return null;
  const req = await db.feedbackRequest.findUnique({
    where: { id: requestId }
  });
  return mapRequest(req);
}

export async function insert({
  id,
  from_user_id,
  to_user_id,
  topic,
  created_at,
  status = "OPEN",
  visibility = "with_managers",
}) {
  const req = await db.feedbackRequest.create({
    data: {
      id,
      fromUserId: from_user_id,
      toUserId: to_user_id,
      topic,
      status,
      visibility,
      createdAt: created_at ? new Date(created_at) : new Date()
    }
  });
  return mapRequest(req);
}

export async function findIdByFromUserTopicLike(fromUserId, topicLike) {
  const cleanedTopic = topicLike.replace(/%/g, '');
  const req = await db.feedbackRequest.findFirst({
    where: {
      fromUserId,
      topic: { startsWith: cleanedTopic }
    },
    select: { id: true }
  });
  return req ?? null;
}

export async function markCompleted(requestId) {
  if (!requestId) return;
  await db.feedbackRequest.update({
    where: { id: requestId },
    data: { status: 'COMPLETED' }
  });
}

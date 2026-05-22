import { db } from "../db/database.js";

export async function listByRequestId(requestId) {
  if (!requestId) return [];
  const list = await db.feedbackEntry.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' }
  });
  return list.map((item) => ({
    id: item.id,
    request_id: item.requestId,
    author_id: item.fromUserId,
    content: item.body,
    created_at: item.createdAt.toISOString()
  }));
}

export async function insert({ id, request_id, author_id, content, created_at }) {
  const req = await db.feedbackRequest.findUnique({
    where: { id: request_id }
  });
  const toUserId = req ? req.toUserId : null;

  const item = await db.feedbackEntry.create({
    data: {
      id,
      requestId: request_id,
      fromUserId: author_id,
      toUserId: toUserId,
      body: content,
      createdAt: created_at ? new Date(created_at) : new Date()
    }
  });

  return {
    id: item.id,
    request_id: item.requestId,
    author_id: item.fromUserId,
    content: item.body,
    created_at: item.createdAt.toISOString()
  };
}

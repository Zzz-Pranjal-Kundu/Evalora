import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

async function mapReview(r) {
  if (!r) return null;
  const employee = await db.employee.findUnique({
    where: { id: r.employeeId }
  });
  const reviewer = await db.employee.findUnique({
    where: { id: r.reviewerId }
  });
  return {
    id: r.id,
    cycle_id: r.cycleId,
    employee_id: employee?.userId || r.employeeId,
    reviewer_id: reviewer?.userId || r.reviewerId,
    status: r.status,
    rating: r.rating,
    summary: r.summary,
    visibility: r.visibility,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString()
  };
}

export async function findAll() {
  const list = await db.review.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return Promise.all(list.map(mapReview));
}

export async function findForReviewerOrEmployee(userId) {
  if (!userId) return [];
  const emp = await db.employee.findUnique({ where: { userId } });
  if (!emp) return [];

  const list = await db.review.findMany({
    where: {
      OR: [
        { reviewerId: emp.id },
        { employeeId: emp.id }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
  return Promise.all(list.map(mapReview));
}

export async function findForEmployee(userId) {
  if (!userId) return [];
  const emp = await db.employee.findUnique({ where: { userId } });
  if (!emp) return [];

  const list = await db.review.findMany({
    where: { employeeId: emp.id },
    orderBy: { createdAt: 'desc' }
  });
  return Promise.all(list.map(mapReview));
}

export async function findById(reviewId) {
  if (!reviewId) return null;
  const r = await db.review.findUnique({
    where: { id: reviewId }
  });
  return mapReview(r);
}

export async function hasAnyForEmployee(userId) {
  if (!userId) return false;
  const emp = await db.employee.findUnique({ where: { userId } });
  if (!emp) return false;

  const count = await db.review.count({
    where: { employeeId: emp.id }
  });
  return count > 0;
}

export async function insert({
  cycle_id,
  employee_id,
  reviewer_id,
  status,
  rating,
  summary,
  visibility = "participants_only",
}) {
  const id = randomUUID();
  const emp = await db.employee.findUnique({ where: { userId: employee_id } });
  const rev = await db.employee.findUnique({ where: { userId: reviewer_id } });
  if (!emp || !rev) {
    throw new Error("Employee or reviewer profile not found");
  }

  const r = await db.review.create({
    data: {
      id,
      cycleId: cycle_id,
      employeeId: emp.id,
      reviewerId: rev.id,
      status,
      rating: rating !== undefined ? parseFloat(rating) : null,
      summary,
      visibility
    }
  });
  return findById(r.id);
}

export async function updateFields(reviewId, { status, rating, summary, visibility, updated_at }) {
  const prev = await db.review.findUnique({ where: { id: reviewId } });
  if (!prev) return null;
  const vis = visibility !== undefined ? visibility : prev.visibility || "participants_only";

  const updateData = {
    status: status !== undefined ? status : prev.status,
    rating: rating !== undefined ? parseFloat(rating) : prev.rating,
    summary: summary !== undefined ? summary : prev.summary,
    visibility: vis,
    updatedAt: updated_at ? new Date(updated_at) : new Date()
  };

  await db.review.update({
    where: { id: reviewId },
    data: updateData
  });
  return findById(reviewId);
}

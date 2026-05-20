/** API resource shape for a performance review row. */
export function toReview(row) {
  return row;
}

export function toReviewList(rows) {
  return rows.map(toReview);
}

/** API resource shape for a review cycle row. */
export function toCycle(row) {
  return row;
}

export function toCycleList(rows) {
  return rows.map(toCycle);
}

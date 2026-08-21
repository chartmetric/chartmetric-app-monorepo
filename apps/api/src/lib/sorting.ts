/**
 * Resolves the effective ORDER BY direction for a list endpoint: an explicit
 * request wins; otherwise the useful first look depends on the column —
 * labels read ascending, metrics descending.
 */
export const resolveSortDirection = (
  requested: "asc" | "desc" | undefined,
  sortBy: string,
  ascendingFirst: ReadonlySet<string>,
): "ASC" | "DESC" => {
  const direction = requested ?? (ascendingFirst.has(sortBy) ? "asc" : "desc");

  return direction === "asc" ? "ASC" : "DESC";
};

import type {
  AthleteFilters,
  AthleteListQuery,
  AthleteSortBy,
} from "../api/types";

import { DEFAULT_ATHLETE_QUERY } from "../api/athlete-list";

export const replaceFilters = (
  query: AthleteListQuery,
  filters: AthleteFilters,
): AthleteListQuery => ({
  limit: query.limit,
  offset: 0,
  sortBy: query.sortBy ?? DEFAULT_ATHLETE_QUERY.sortBy,
  sortDirection: query.sortDirection ?? DEFAULT_ATHLETE_QUERY.sortDirection,
  ...filters,
});

// Descending is the useful first click on a metric; rank and the text columns
// read naturally ascending.
const ASCENDING_FIRST_SORTS = new Set<AthleteSortBy>([
  "name",
  "nationality",
  "rank",
  "sport",
  "type",
]);

const nextSortDirection = (
  isSameColumn: boolean,
  currentDirection: "asc" | "desc",
  nextSortBy: AthleteSortBy,
): "asc" | "desc" => {
  if (isSameColumn) return currentDirection === "asc" ? "desc" : "asc";

  return ASCENDING_FIRST_SORTS.has(nextSortBy) ? "asc" : "desc";
};

export const changeQuerySort = (
  query: AthleteListQuery,
  nextSortBy: AthleteSortBy,
): AthleteListQuery => ({
  ...query,
  offset: 0,
  sortBy: nextSortBy,
  sortDirection: nextSortDirection(
    (query.sortBy ?? DEFAULT_ATHLETE_QUERY.sortBy) === nextSortBy,
    query.sortDirection ?? DEFAULT_ATHLETE_QUERY.sortDirection,
    nextSortBy,
  ),
});

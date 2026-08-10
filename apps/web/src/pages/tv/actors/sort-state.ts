import type {
  ActorListQuery,
  ActorSortBy,
  ActorSortDirection,
} from "./api/types";

import { DEFAULT_ACTOR_QUERY } from "./api/actor-list";

// Descending is the useful first click on a metric; the actor name reads
// naturally ascending.
const ASCENDING_FIRST_SORTS: ReadonlySet<ActorSortBy> = new Set(["name"]);

const nextSortDirection = (
  isSameColumn: boolean,
  currentDirection: ActorSortDirection,
  nextSortBy: ActorSortBy,
): ActorSortDirection => {
  if (isSameColumn) return currentDirection === "asc" ? "desc" : "asc";

  return ASCENDING_FIRST_SORTS.has(nextSortBy) ? "asc" : "desc";
};

export const changeQuerySort = (
  query: ActorListQuery,
  nextSortBy: ActorSortBy,
): ActorListQuery => ({
  ...query,
  offset: 0,
  sortBy: nextSortBy,
  sortDirection: nextSortDirection(
    (query.sortBy ?? DEFAULT_ACTOR_QUERY.sortBy) === nextSortBy,
    query.sortDirection ?? DEFAULT_ACTOR_QUERY.sortDirection,
    nextSortBy,
  ),
});

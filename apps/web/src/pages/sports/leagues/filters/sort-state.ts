import type {
  LeagueFilters,
  LeagueListQuery,
  LeagueSortBy,
  LeagueSortDirection,
} from "../api/types";

import { DEFAULT_LEAGUE_QUERY } from "../api/league-list";

export const replaceFilters = (
  query: LeagueListQuery,
  filters: LeagueFilters,
): LeagueListQuery => ({
  limit: query.limit,
  offset: 0,
  sortBy: query.sortBy ?? DEFAULT_LEAGUE_QUERY.sortBy,
  sortDirection: query.sortDirection ?? DEFAULT_LEAGUE_QUERY.sortDirection,
  ...filters,
});

// Descending is the useful first click on a metric; names and sports read
// naturally ascending. Must stay in lockstep with ASCENDING_FIRST in
// apps/api/src/modules/leagues/routes/list-leagues/queries.ts, which resolves
// an omitted direction — the test pins every member's first-click direction.
const ASCENDING_FIRST_SORTS = new Set<LeagueSortBy>(["name", "sport"]);

const nextSortDirection = (
  isSameColumn: boolean,
  currentDirection: LeagueSortDirection,
  nextSortBy: LeagueSortBy,
): LeagueSortDirection => {
  if (isSameColumn) return currentDirection === "asc" ? "desc" : "asc";

  return ASCENDING_FIRST_SORTS.has(nextSortBy) ? "asc" : "desc";
};

export const changeQuerySort = (
  query: LeagueListQuery,
  nextSortBy: LeagueSortBy,
): LeagueListQuery => ({
  ...query,
  offset: 0,
  sortBy: nextSortBy,
  sortDirection: nextSortDirection(
    (query.sortBy ?? DEFAULT_LEAGUE_QUERY.sortBy) === nextSortBy,
    query.sortDirection ?? DEFAULT_LEAGUE_QUERY.sortDirection,
    nextSortBy,
  ),
});

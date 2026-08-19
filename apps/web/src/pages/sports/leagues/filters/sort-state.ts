import type { DataTableSortDirection } from "@repo/ui/data-table";

import type {
  LeagueFilters,
  LeagueListQuery,
  LeagueSortBy,
} from "../api/types";

import { DEFAULT_LEAGUE_QUERY } from "../api/league-list";

export const replaceFilters = (
  query: LeagueListQuery,
  filters: LeagueFilters,
): LeagueListQuery => ({
  limit: query.limit,
  offset: 0,
  sortBy: query.sortBy ?? DEFAULT_LEAGUE_QUERY.sortBy,
  ...filters,
});

export const changeQuerySort = (
  query: LeagueListQuery,
  nextSortBy: LeagueSortBy,
): LeagueListQuery => ({
  ...query,
  offset: 0,
  sortBy: nextSortBy,
});

// `GET /app/leagues` accepts no sortDirection: the API fixes the direction per
// column, names and sports ascending and athlete counts descending. Mirroring
// that rule is what keeps the header icon showing the order the server actually
// returned rather than a direction this page believes it asked for.
const SERVER_ASCENDING_SORTS: ReadonlySet<LeagueSortBy> = new Set([
  "name",
  "sport",
]);

export const sortDirectionFor = (
  sortBy: LeagueSortBy,
): DataTableSortDirection =>
  SERVER_ASCENDING_SORTS.has(sortBy) ? "asc" : "desc";

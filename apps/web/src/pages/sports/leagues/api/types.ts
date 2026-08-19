import type { GetQuery, GetReply } from "@repo/api-client";

export type LeagueListQuery = GetQuery<"/app/leagues">;

export type LeagueListReply = GetReply<"/app/leagues">;

export type League = LeagueListReply["data"][number];

export type KeyAthlete = League["keyAthletes"][number];

export type LeagueFilters = Pick<
  LeagueListQuery,
  | "megaOnly"
  | "minAggregatedIgFollowers"
  | "minTrackedAthletes"
  | "name"
  | "sports"
>;

export type LeagueSortBy = NonNullable<LeagueListQuery["sortBy"]>;

export type LeagueFilterOptionsReply = GetReply<"/app/leagues/filter-options">;

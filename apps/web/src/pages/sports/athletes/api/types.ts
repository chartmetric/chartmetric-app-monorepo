import type { GetQuery, GetReply } from "@repo/api-client";

export type AthleteListQuery = GetQuery<"/app/athletes">;

export type AthleteListReply = GetReply<"/app/athletes">;

export type Athlete = AthleteListReply["data"][number];

export type AthleteLevel = NonNullable<AthleteListQuery["levels"]>[number];

export type AthleteFilters = Pick<
  AthleteListQuery,
  | "clubs"
  | "excludeNationalities"
  | "excludeSports"
  | "excludeTypes"
  | "leagues"
  | "levels"
  | "maxCmScore"
  | "maxFollowers"
  | "minCmScore"
  | "minFollowers"
  | "name"
  | "nationalities"
  | "sports"
  | "types"
  | "verified"
>;

export type AthleteSortBy = NonNullable<AthleteListQuery["sortBy"]>;
export type AthleteSortDirection = NonNullable<
  AthleteListQuery["sortDirection"]
>;

export type AthleteFilterOptionsReply =
  GetReply<"/app/athletes/filter-options">;

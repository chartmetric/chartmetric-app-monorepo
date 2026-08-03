import type { paths } from "@repo/api-client";

import { apiClient } from "../../../api/client";

export const ATHLETE_PAGE_SIZE = 25;

export type AthleteListQuery =
  paths["/app/athletes"]["get"]["parameters"]["query"];

export type AthleteListReply =
  paths["/app/athletes"]["get"]["responses"][200]["content"]["application/json"];

export type Athlete = AthleteListReply["data"][number];

export type AthleteFilters = Pick<
  AthleteListQuery,
  | "excludeNationalities"
  | "excludeSports"
  | "excludeTypes"
  | "maxCmScore"
  | "minCmScore"
  | "name"
  | "nationalities"
  | "sports"
  | "types"
>;

export type AthleteSortBy = NonNullable<AthleteListQuery["sortBy"]>;
export type AthleteSortDirection = NonNullable<
  AthleteListQuery["sortDirection"]
>;

export const DEFAULT_ATHLETE_QUERY = {
  limit: ATHLETE_PAGE_SIZE,
  offset: 0,
  sortBy: "cmScore",
  sortDirection: "desc",
} satisfies AthleteListQuery;

export const loadAthletes = async (
  query: AthleteListQuery,
): Promise<AthleteListReply> => {
  const result = await apiClient.GET("/app/athletes", {
    params: { query },
  });

  if (result.data === undefined) {
    throw new Error("Athlete request failed");
  }

  return result.data;
};

import type { AthleteListQuery, AthleteListReply } from "./types";

import { apiClient } from "../../../../api/client";

export const ATHLETE_PAGE_SIZE = 25;

export const DEFAULT_ATHLETE_QUERY = {
  limit: ATHLETE_PAGE_SIZE,
  offset: 0,
  sortBy: "rank",
  sortDirection: "asc",
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

import type { LeagueListQuery, LeagueListReply } from "./types";

import { apiClient } from "../../../../api/client";

export const LEAGUE_PAGE_SIZE = 25;

export const DEFAULT_LEAGUE_QUERY = {
  limit: LEAGUE_PAGE_SIZE,
  offset: 0,
  sortBy: "name",
} satisfies LeagueListQuery;

export const loadLeagues = async (
  query: LeagueListQuery,
): Promise<LeagueListReply> => {
  const result = await apiClient.GET("/app/leagues", {
    params: { query },
  });

  if (result.data === undefined) {
    throw new Error("League request failed");
  }

  return result.data;
};

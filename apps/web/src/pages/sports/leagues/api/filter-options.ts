import type { LeagueFilterOptionsReply } from "./types";

import { apiClient } from "../../../../api/client";

export const loadLeagueFilterOptions =
  async (): Promise<LeagueFilterOptionsReply> => {
    const result = await apiClient.GET("/app/leagues/filter-options");

    if (result.data === undefined) {
      throw new Error("League filter options request failed");
    }

    return result.data;
  };

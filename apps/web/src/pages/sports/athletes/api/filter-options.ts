import type { AthleteFilterOptionsReply } from "./types";

import { apiClient } from "../../../../api/client";

export const loadAthleteFilterOptions =
  async (): Promise<AthleteFilterOptionsReply> => {
    const result = await apiClient.GET("/app/athletes/filter-options");

    if (result.data === undefined) {
      throw new Error("Athlete filter options request failed");
    }

    return result.data;
  };

import type { paths } from "@repo/api-client";

import { apiClient } from "../../../api/client";

export type AthleteFilterOptionsReply =
  paths["/app/athletes/filter-options"]["get"]["responses"][200]["content"]["application/json"];

export const loadAthleteFilterOptions =
  async (): Promise<AthleteFilterOptionsReply> => {
    const result = await apiClient.GET("/app/athletes/filter-options");

    if (result.data === undefined) {
      throw new Error("Athlete filter options request failed");
    }

    return result.data;
  };

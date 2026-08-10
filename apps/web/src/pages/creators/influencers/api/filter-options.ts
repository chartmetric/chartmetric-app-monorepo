import type { InfluencerFilterOptionsReply } from "../types";

import { apiClient } from "../../../../api/client";

export const loadInfluencerFilterOptions =
  async (): Promise<InfluencerFilterOptionsReply> => {
    const result = await apiClient.GET("/app/influencers/filter-options");

    if (result.data === undefined) {
      throw new Error("Influencer filter options request failed");
    }

    return result.data;
  };

import type { InfluencerListQuery, InfluencerListReply } from "../types";

import { apiClient } from "../../../../api/client";

export const loadInfluencers = async (
  query: InfluencerListQuery,
): Promise<InfluencerListReply> => {
  const result = await apiClient.GET("/app/influencers", {
    params: { query },
  });

  if (result.data === undefined) {
    throw new Error("Influencer request failed");
  }

  return result.data;
};

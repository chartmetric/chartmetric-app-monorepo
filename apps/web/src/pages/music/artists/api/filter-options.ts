import type { ArtistFilterOptionsReply } from "../types";

import { apiClient } from "../../../../api/client";

export const loadArtistFilterOptions =
  async (): Promise<ArtistFilterOptionsReply> => {
    const result = await apiClient.GET("/app/artists/filter-options");

    if (result.data === undefined) {
      throw new Error("Artist filter options request failed");
    }

    return result.data;
  };

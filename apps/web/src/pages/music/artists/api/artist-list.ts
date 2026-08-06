import type { ArtistListQuery, ArtistListReply } from "../types";

import { apiClient } from "../../../../api/client";

export const loadArtists = async (
  query: ArtistListQuery,
): Promise<ArtistListReply> => {
  const result = await apiClient.GET("/app/artists", {
    params: { query },
  });

  if (result.data === undefined) {
    throw new Error("Artist request failed");
  }

  return result.data;
};

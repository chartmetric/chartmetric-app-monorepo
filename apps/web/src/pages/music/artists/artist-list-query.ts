import type { paths } from "@repo/api-client";

import { apiClient } from "../../../api/client";

export const ARTIST_PAGE_SIZE = 25;

export type ArtistListQuery =
  paths["/app/artists"]["get"]["parameters"]["query"];

export type ArtistListReply =
  paths["/app/artists"]["get"]["responses"][200]["content"]["application/json"];

export type Artist = ArtistListReply["data"][number];

export type ArtistSortBy = NonNullable<ArtistListQuery["sortBy"]>;
export type ArtistSortDirection = NonNullable<ArtistListQuery["sortDirection"]>;

export const DEFAULT_ARTIST_QUERY = {
  limit: ARTIST_PAGE_SIZE,
  offset: 0,
  sortBy: "cmScore",
  sortDirection: "desc",
} satisfies ArtistListQuery;

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

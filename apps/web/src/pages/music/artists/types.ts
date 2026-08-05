import type { paths } from "@repo/api-client";

export type ArtistListQuery =
  paths["/app/artists"]["get"]["parameters"]["query"];

export type ArtistListReply =
  paths["/app/artists"]["get"]["responses"][200]["content"]["application/json"];

export type Artist = ArtistListReply["data"][number];

export type ArtistSortBy = NonNullable<ArtistListQuery["sortBy"]>;
export type ArtistSortDirection = NonNullable<ArtistListQuery["sortDirection"]>;
export type ArtistChangePeriod = NonNullable<ArtistListQuery["changePeriod"]>;

export type MetricDisplayMode = "total" | "change" | "percentChange";

export type MetricSortFamily =
  "cmScore" | "instagramFollowers" | "tiktokFollowers";

import type { paths } from "@repo/api-client";

export type InfluencerListQuery =
  paths["/app/influencers"]["get"]["parameters"]["query"];

export type InfluencerListReply =
  paths["/app/influencers"]["get"]["responses"][200]["content"]["application/json"];

export type Influencer = InfluencerListReply["data"][number];

export type InfluencerSortBy = NonNullable<InfluencerListQuery["sortBy"]>;
export type InfluencerSortDirection = NonNullable<
  InfluencerListQuery["sortDirection"]
>;

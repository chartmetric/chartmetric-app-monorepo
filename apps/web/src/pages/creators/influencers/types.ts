import type { paths } from "@repo/api-client";

export type InfluencerListQuery =
  paths["/app/influencers"]["get"]["parameters"]["query"];

export type InfluencerListReply =
  paths["/app/influencers"]["get"]["responses"][200]["content"]["application/json"];

export type Influencer = InfluencerListReply["data"][number];

export type InfluencerSortBy = NonNullable<InfluencerListQuery["sortBy"]>;
export type InfluencerFilters = Pick<
  InfluencerListQuery,
  | "ageGroups"
  | "categories"
  | "countries"
  | "excludeAgeGroups"
  | "excludeCategories"
  | "excludeCountries"
  | "excludeGenders"
  | "genders"
  | "handle"
>;

export type InfluencerFilterOptionsReply =
  paths["/app/influencers/filter-options"]["get"]["responses"][200]["content"]["application/json"];

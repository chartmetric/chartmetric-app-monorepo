import type { InfluencerListQuery, InfluencerSortBy } from "./types";

export const INFLUENCER_PAGE_SIZE = 25;

export const DEFAULT_INFLUENCER_SORT_BY: InfluencerSortBy = "name";

export const DEFAULT_INFLUENCER_QUERY = {
  limit: INFLUENCER_PAGE_SIZE,
  offset: 0,
} satisfies InfluencerListQuery;

import type { PaginationQuery } from "../../../../lib/pagination.ts";
import type { InfluencerRow } from "./queries.ts";
import type { ListInfluencersReply } from "./schemas.ts";

import { emptyToNull } from "../../../../lib/strings.ts";

// `creator_tags`/`creator_subtags` arrive as JSON-encoded strings (e.g.
// `["Music","News & Politics"]`); a missing value is `''`.
const parseStringArray = (value: string | null | undefined): string[] => {
  if (typeof value !== "string" || value === "") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

export const toInfluencerList = (
  influencers: InfluencerRow[],
  pagination: PaginationQuery,
  total: number,
): ListInfluencersReply => ({
  data: influencers.map((influencer) => ({
    ageGroup: emptyToNull(influencer.creator_age_group),
    categories: parseStringArray(influencer.creator_tags),
    city: emptyToNull(influencer.creator_city),
    country: emptyToNull(influencer.creator_country),
    gender: emptyToNull(influencer.creator_gender),
    id: influencer.id,
    instagramHandle: emptyToNull(influencer.instagram_handle),
    name: emptyToNull(influencer.name),
    subtags: parseStringArray(influencer.creator_subtags),
    tiktokHandle: emptyToNull(influencer.tiktok_handle),
    youtubeHandle: emptyToNull(influencer.youtube_handle),
  })),
  meta: {
    limit: pagination.limit,
    offset: pagination.offset,
    total,
  },
});

import type { PaginationQuery } from "../../../../lib/pagination.ts";
import type { ArtistRow } from "./queries.ts";
import type { ListArtistsReply } from "./schemas.ts";

import { toNumber, type WarehouseNumber } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";

// hypequery types Int64 as string, but the wire value is numeric whenever the
// server runs with output_format_json_quote_64bit_integers = 0.
type ArtistRowInput = Omit<
  ArtistRow,
  | "instagram_followers"
  | "instagram_followers_change"
  | "tiktok_followers"
  | "tiktok_followers_change"
> & {
  instagram_followers: WarehouseNumber;
  instagram_followers_change: WarehouseNumber;
  tiktok_followers: WarehouseNumber;
  tiktok_followers_change: WarehouseNumber;
};

export const toArtistList = (
  artists: ArtistRowInput[],
  pagination: PaginationQuery,
): ListArtistsReply => ({
  data: artists.map((artist) => ({
    cmScore: artist.cm_score,
    cmScoreChange: artist.cm_score_change,
    cmScoreChangePercent: artist.cm_score_change_percent,
    countryCode: emptyToNull(artist.code2),
    id: artist.id,
    imageUrl:
      emptyToNull(artist.profile_image_url) ?? emptyToNull(artist.image_url),
    instagramFollowers: toNumber(artist.instagram_followers),
    instagramFollowersChange: toNumber(artist.instagram_followers_change),
    instagramFollowersChangePercent: artist.instagram_followers_change_percent,
    isVerified: artist.is_verified === 1,
    name: emptyToNull(artist.profile_name) ?? artist.name,
    recordLabel: emptyToNull(artist.record_label),
    tiktokFollowers: toNumber(artist.tiktok_followers),
    tiktokFollowersChange: toNumber(artist.tiktok_followers_change),
    tiktokFollowersChangePercent: artist.tiktok_followers_change_percent,
  })),
  meta: {
    limit: pagination.limit,
    offset: pagination.offset,
  },
});

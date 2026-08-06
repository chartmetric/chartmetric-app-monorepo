import type { createQueryBuilder } from "@hypequery/clickhouse";

import type { Database } from "../../../../db/clickhouse/schema.ts";
import type { ListArtistsQuery } from "./schemas.ts";

type ArtistTag = Database["new_vertical.l_cm_artist_tag"];
type IgCache = Database["new_vertical.instagram_cache"];
type Profile = Database["new_vertical.profile"];
type ProfileAccount = Database["new_vertical.l_profile_account"];
type ProfileSnapshot = Database["new_vertical.profile_snapshots"];
type Scores = Database["new_vertical.cm_scores"];
type TtCache = Database["new_vertical.tiktok_cache"];

// Stays a no-op if the warehouse column is already nullable.
type NullableColumn<Column extends string> =
  Column extends `Nullable(${string})` ? Column : `Nullable(${Column})`;

// CTE aliases are query-scoped virtual tables, so the generator cannot
// introspect them and `withCTE` discards the subquery's type: declaring them
// here is the only way `leftAnyJoin` accepts the alias. Columns carrying a
// warehouse value through reference the generated schema so an upstream type
// change surfaces here; a string literal marks a value this query computes.
export interface ArtistMetricCtes {
  artist_metrics: {
    artist_id: "Nullable(Int32)";
    cm_score: NullableColumn<Scores["cm_score"]>;
    cm_score_change: "Nullable(Float64)";
    cm_score_change_percent: "Nullable(Float64)";
    instagram_followers: NullableColumn<IgCache["followers"]>;
    instagram_followers_change: "Nullable(Int64)";
    instagram_followers_change_percent: "Nullable(Float64)";
    is_verified: "Nullable(UInt8)";
    profile_image_url: NullableColumn<Profile["image_url"]>;
    profile_name: NullableColumn<Profile["name"]>;
    tiktok_followers: NullableColumn<TtCache["follower_count"]>;
    tiktok_followers_change: "Nullable(Int64)";
    tiktok_followers_change_percent: "Nullable(Float64)";
  };
  genre_exclude: { cm_artist: ArtistTag["cm_artist"] };
  genre_match: { cm_artist: ArtistTag["cm_artist"] };
  latest_ig: {
    account_id: IgCache["account_id"];
    instagram_followers: IgCache["followers"];
    instagram_followers_past: IgCache["followers"];
    instagram_has_past: "UInt8";
  };
  latest_score: {
    cm_has_past: "UInt8";
    cm_score: Scores["cm_score"];
    cm_score_past: Scores["cm_score"];
    profile_id: Scores["profile_id"];
  };
  latest_tt: {
    account_id: TtCache["account_id"];
    tiktok_followers: TtCache["follower_count"];
    tiktok_followers_past: TtCache["follower_count"];
    tiktok_has_past: "UInt8";
  };
  profile_ig: {
    instagram_followers: IgCache["followers"];
    instagram_followers_past: IgCache["followers"];
    instagram_has_past: "UInt8";
    profile_id: ProfileAccount["profile_id"];
  };
  profile_tt: {
    profile_id: ProfileAccount["profile_id"];
    tiktok_followers: TtCache["follower_count"];
    tiktok_followers_past: TtCache["follower_count"];
    tiktok_has_past: "UInt8";
  };
  profile_verified: {
    is_verified: "UInt8";
    profile_id: ProfileSnapshot["profile_id"];
  };
}

export type MetricsDatabase = ReturnType<
  typeof createQueryBuilder<Database & ArtistMetricCtes>
>;

export type MetricsQueryFactory = (database: MetricsDatabase) => unknown;
export type PeriodQueryFactory = (
  database: MetricsDatabase,
  periodDays: number,
) => unknown;
export type GenreQueryFactory = (
  database: MetricsDatabase,
  slugs: string[],
) => unknown;
export type ListArtistsQueryFactory = (
  database: MetricsDatabase,
  query: ListArtistsQuery,
) => unknown;

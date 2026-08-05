import type { createQueryBuilder } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { Database } from "../../../../db/clickhouse/schema.ts";
import type { ListArtistsQuery } from "./schemas.ts";

// CTE aliases are query-scoped virtual tables, so they cannot appear in the
// introspected schema; declaring them here keeps the builder fully typed.
export interface ArtistMetricCtes {
  artist_metrics: {
    artist_id: "Nullable(Int32)";
    cm_score: "Nullable(Float64)";
    cm_score_change: "Nullable(Float64)";
    cm_score_change_percent: "Nullable(Float64)";
    instagram_followers: "Nullable(Int64)";
    instagram_followers_change: "Nullable(Int64)";
    instagram_followers_change_percent: "Nullable(Float64)";
    is_verified: "Nullable(UInt8)";
    profile_image_url: "Nullable(String)";
    profile_name: "Nullable(String)";
    tiktok_followers: "Nullable(Int64)";
    tiktok_followers_change: "Nullable(Int64)";
    tiktok_followers_change_percent: "Nullable(Float64)";
  };
  latest_ig: {
    account_id: "UInt32";
    instagram_followers: "Int64";
    instagram_followers_past: "Int64";
    instagram_has_past: "UInt8";
  };
  latest_score: {
    cm_has_past: "UInt8";
    cm_score: "Float64";
    cm_score_past: "Float64";
    profile_id: "UInt32";
  };
  latest_tt: {
    account_id: "UInt32";
    tiktok_followers: "Int64";
    tiktok_followers_past: "Int64";
    tiktok_has_past: "UInt8";
  };
  profile_ig: {
    instagram_followers: "Int64";
    instagram_followers_past: "Int64";
    instagram_has_past: "UInt8";
    profile_id: "UInt32";
  };
  profile_tt: {
    profile_id: "UInt32";
    tiktok_followers: "Int64";
    tiktok_followers_past: "Int64";
    tiktok_has_past: "UInt8";
  };
  profile_verified: { is_verified: "UInt8"; profile_id: "UInt32" };
}

export type MetricsDatabase = ReturnType<
  typeof createQueryBuilder<Database & ArtistMetricCtes>
>;

export type DatabaseQueryFactory = (database: ClickHouseDatabase) => unknown;
export type MetricsQueryFactory = (database: MetricsDatabase) => unknown;
export type PeriodQueryFactory = (
  database: MetricsDatabase,
  periodDays: number,
) => unknown;
export type ListArtistsQueryFactory = (
  database: MetricsDatabase,
  query: ListArtistsQuery,
) => unknown;

import { type createQueryBuilder, rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { Database } from "../../../../db/clickhouse/schema.ts";
import type { ListArtistsQuery } from "./schemas.ts";

const sortColumns = {
  cmScore: "cm_score",
  countryCode: "code2",
  instagramFollowers: "instagram_followers",
  name: "name",
  tiktokFollowers: "tiktok_followers",
} as const;

// CTE aliases are query-scoped virtual tables, so they cannot appear in the
// introspected schema; declaring them here keeps the builder fully typed.
interface ArtistMetricCtes {
  artist_metrics: {
    artist_id: "Nullable(Int32)";
    cm_score: "Nullable(Float64)";
    instagram_followers: "Nullable(Int64)";
    is_verified: "Nullable(UInt8)";
    profile_image_url: "Nullable(String)";
    profile_name: "Nullable(String)";
    tiktok_followers: "Nullable(Int64)";
  };
  latest_ig: { account_id: "UInt32"; instagram_followers: "Int64" };
  latest_score: { cm_score: "Float64"; profile_id: "UInt32" };
  latest_tt: { account_id: "UInt32"; tiktok_followers: "Int64" };
  profile_ig: { instagram_followers: "Int64"; profile_id: "UInt32" };
  profile_tt: { profile_id: "UInt32"; tiktok_followers: "Int64" };
  profile_verified: { is_verified: "UInt8"; profile_id: "UInt32" };
}

type MetricsDatabase = ReturnType<
  typeof createQueryBuilder<Database & ArtistMetricCtes>
>;

type DatabaseQueryFactory = (database: ClickHouseDatabase) => unknown;
type MetricsQueryFactory = (database: MetricsDatabase) => unknown;
type ListArtistsQueryFactory = (
  database: MetricsDatabase,
  query: ListArtistsQuery,
) => unknown;

const latestInstagramSnapshots = ((database) =>
  database
    .table("new_vertical.instagram_cache")
    .select(["account_id"])
    .argMax("followers", "snapshot_date", "instagram_followers")
    .groupBy("account_id")) satisfies MetricsQueryFactory;

const latestTiktokSnapshots = ((database) =>
  database
    .table("new_vertical.tiktok_cache")
    .select(["account_id"])
    .argMax("follower_count", "snapshot_date", "tiktok_followers")
    .groupBy("account_id")) satisfies MetricsQueryFactory;

const instagramFollowersByProfile = ((database) =>
  database
    .table("new_vertical.l_profile_account")
    .final()
    .innerJoin("latest_ig", "account_id", "latest_ig.account_id")
    .select(["profile_id"])
    .max("latest_ig.instagram_followers", "instagram_followers")
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

const tiktokFollowersByProfile = ((database) =>
  database
    .table("new_vertical.l_profile_account")
    .final()
    .innerJoin("latest_tt", "account_id", "latest_tt.account_id")
    .select(["profile_id"])
    .max("latest_tt.tiktok_followers", "tiktok_followers")
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

const latestCmScores = ((database) =>
  database
    .table("new_vertical.cm_scores")
    .select(["profile_id"])
    .argMax("cm_score", "score_date", "cm_score")
    .where("profile_type", "eq", "musician")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

// A profile counts as verified when any of its snapshots says so: the table
// mixes several accounts per (profile, platform, snapshot_date), so
// latest-snapshot semantics would arbitrarily pick an unverified fan account.
const verifiedByProfile = ((database) =>
  database
    .table("new_vertical.profile_snapshots")
    .select([
      "profile_id",
      rawAs<number, "is_verified">("max(verified = 'true')", "is_verified"),
    ])
    .where("platform", "in", ["instagram", "tiktok"])
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

const artistMetrics = ((database) =>
  database
    .table("new_vertical.profile")
    .final()
    .leftAnyJoin("latest_score", "id", "latest_score.profile_id")
    .leftAnyJoin("profile_ig", "id", "profile_ig.profile_id")
    .leftAnyJoin("profile_tt", "id", "profile_tt.profile_id")
    .leftAnyJoin("profile_verified", "id", "profile_verified.profile_id")
    .select([
      // ClickHouse cannot join UInt64 and Int32 keys (no common supertype),
      // so the profile-side key is cast down to cm_artist's Int32 id type.
      rawAs<number | null, "artist_id">(
        "accurateCastOrNull(cm_source_id, 'Int32')",
        "artist_id",
      ),
      "name as profile_name",
      "image_url as profile_image_url",
      "latest_score.cm_score",
      "profile_ig.instagram_followers",
      "profile_tt.tiktok_followers",
      "profile_verified.is_verified",
    ])
    .where("profile_type", "eq", "musician")
    .where("vertical", "eq", "music")
    .whereNull("deleted_at")) satisfies MetricsQueryFactory;

const listArtists = ((database, query) => {
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";

  return database
    .table("new_vertical.cm_artist")
    .withCTE("latest_ig", latestInstagramSnapshots(database))
    .withCTE("latest_tt", latestTiktokSnapshots(database))
    .withCTE("profile_ig", instagramFollowersByProfile(database))
    .withCTE("profile_tt", tiktokFollowersByProfile(database))
    .withCTE("latest_score", latestCmScores(database))
    .withCTE("profile_verified", verifiedByProfile(database))
    .withCTE("artist_metrics", artistMetrics(database))
    .final()
    .leftAnyJoin("artist_metrics", "id", "artist_metrics.artist_id")
    .select([
      "id",
      "name",
      "image_url",
      "code2",
      "record_label",
      "artist_metrics.profile_name",
      "artist_metrics.profile_image_url",
      "artist_metrics.cm_score",
      "artist_metrics.instagram_followers",
      "artist_metrics.tiktok_followers",
      "artist_metrics.is_verified",
    ])
    .where("is_duplicate", "eq", 0)
    .where("is_non_artist", "eq", 0)
    .orderBy(sortColumns[sortBy], sortDirection.toUpperCase() as "ASC" | "DESC")
    .orderBy("id", "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings({
      join_use_nulls: 1,
      max_execution_time: 30,
      max_rows_to_read: 300_000_000,
    });
}) satisfies ListArtistsQueryFactory;

export const createListArtistsQueries = ((database) => {
  const metricsDatabase = database as unknown as MetricsDatabase;

  return {
    listArtists: (query: ListArtistsQuery) =>
      listArtists(metricsDatabase, query),
  };
}) satisfies DatabaseQueryFactory;

type ListArtistsQueries = ReturnType<typeof createListArtistsQueries>;
export type ArtistRow = Awaited<
  ReturnType<ReturnType<ListArtistsQueries["listArtists"]>["execute"]>
>[number];

import { rawAs } from "@hypequery/clickhouse";

import type { ListArtistsQuery } from "./schemas.ts";
import type {
  DatabaseQueryFactory,
  ListArtistsQueryFactory,
  MetricsDatabase,
  MetricsQueryFactory,
  PeriodQueryFactory,
} from "./types.ts";

const sortColumns = {
  cmScore: "cm_score",
  cmScoreChange: "cm_score_change",
  cmScoreChangePercent: "cm_score_change_percent",
  countryCode: "code2",
  instagramFollowers: "instagram_followers",
  instagramFollowersChange: "instagram_followers_change",
  instagramFollowersChangePercent: "instagram_followers_change_percent",
  name: "name",
  tiktokFollowers: "tiktok_followers",
  tiktokFollowersChange: "tiktok_followers_change",
  tiktokFollowersChangePercent: "tiktok_followers_change_percent",
} as const;

const changePeriodDays = { "1d": 1, "7d": 7, "28d": 28 } as const;

// "Past" values are computed in the same scan as the latest ones: rows on or
// before the cutoff win argMax because excluded rows get the epoch sentinel,
// and has-past distinguishes a real 0 from the no-old-snapshot case.
const pastMarkerExpression = (dateColumn: string, periodDays: number): string =>
  `max(${dateColumn} <= today() - ${String(periodDays)})`;

const pastValueExpression = (
  valueColumn: string,
  dateColumn: string,
  periodDays: number,
): string => {
  const cutoff = `${dateColumn} <= today() - ${String(periodDays)}`;

  return `argMax(if(${cutoff}, ${valueColumn}, 0), if(${cutoff}, ${dateColumn}, toDate(0)))`;
};

const latestInstagramSnapshots = ((database, periodDays) =>
  database
    .table("new_vertical.instagram_cache")
    .select([
      "account_id",
      rawAs<number, "instagram_has_past">(
        pastMarkerExpression("snapshot_date", periodDays),
        "instagram_has_past",
      ),
      rawAs<string, "instagram_followers_past">(
        pastValueExpression("followers", "snapshot_date", periodDays),
        "instagram_followers_past",
      ),
    ])
    .argMax("followers", "snapshot_date", "instagram_followers")
    .groupBy("account_id")) satisfies PeriodQueryFactory;

const latestTiktokSnapshots = ((database, periodDays) =>
  database
    .table("new_vertical.tiktok_cache")
    .select([
      "account_id",
      rawAs<number, "tiktok_has_past">(
        pastMarkerExpression("snapshot_date", periodDays),
        "tiktok_has_past",
      ),
      rawAs<string, "tiktok_followers_past">(
        pastValueExpression("follower_count", "snapshot_date", periodDays),
        "tiktok_followers_past",
      ),
    ])
    .argMax("follower_count", "snapshot_date", "tiktok_followers")
    .groupBy("account_id")) satisfies PeriodQueryFactory;

const instagramFollowersByProfile = ((database) =>
  database
    .table("new_vertical.l_profile_account")
    .final()
    .innerJoin("latest_ig", "account_id", "latest_ig.account_id")
    .select(["profile_id"])
    .max("latest_ig.instagram_followers", "instagram_followers")
    .argMax(
      "latest_ig.instagram_followers_past",
      "latest_ig.instagram_followers",
      "instagram_followers_past",
    )
    .argMax(
      "latest_ig.instagram_has_past",
      "latest_ig.instagram_followers",
      "instagram_has_past",
    )
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

const tiktokFollowersByProfile = ((database) =>
  database
    .table("new_vertical.l_profile_account")
    .final()
    .innerJoin("latest_tt", "account_id", "latest_tt.account_id")
    .select(["profile_id"])
    .max("latest_tt.tiktok_followers", "tiktok_followers")
    .argMax(
      "latest_tt.tiktok_followers_past",
      "latest_tt.tiktok_followers",
      "tiktok_followers_past",
    )
    .argMax(
      "latest_tt.tiktok_has_past",
      "latest_tt.tiktok_followers",
      "tiktok_has_past",
    )
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

const latestCmScores = ((database, periodDays) =>
  database
    .table("new_vertical.cm_scores")
    .select([
      "profile_id",
      rawAs<number, "cm_has_past">(
        pastMarkerExpression("score_date", periodDays),
        "cm_has_past",
      ),
      // Qualified because the argMax alias below shadows the source column.
      rawAs<number, "cm_score_past">(
        pastValueExpression("cm_scores.cm_score", "score_date", periodDays),
        "cm_score_past",
      ),
    ])
    .argMax("cm_score", "score_date", "cm_score")
    .where("profile_type", "eq", "musician")
    .groupBy("profile_id")) satisfies PeriodQueryFactory;

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

const changeExpression = (
  cte: string,
  current: string,
  past: string,
  pastMarker: string,
): string =>
  `if(${cte}.${pastMarker} = 1, ${cte}.${current} - ${cte}.${past}, NULL)`;

const changePercentExpression = (
  cte: string,
  current: string,
  past: string,
  pastMarker: string,
): string =>
  `if(${cte}.${pastMarker} = 1 AND ${cte}.${past} > 0, (${cte}.${current} - ${cte}.${past}) / ${cte}.${past} * 100, NULL)`;

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
      rawAs<number | null, "cm_score_change">(
        changeExpression(
          "latest_score",
          "cm_score",
          "cm_score_past",
          "cm_has_past",
        ),
        "cm_score_change",
      ),
      rawAs<number | null, "cm_score_change_percent">(
        changePercentExpression(
          "latest_score",
          "cm_score",
          "cm_score_past",
          "cm_has_past",
        ),
        "cm_score_change_percent",
      ),
      "profile_ig.instagram_followers",
      rawAs<string | null, "instagram_followers_change">(
        changeExpression(
          "profile_ig",
          "instagram_followers",
          "instagram_followers_past",
          "instagram_has_past",
        ),
        "instagram_followers_change",
      ),
      rawAs<number | null, "instagram_followers_change_percent">(
        changePercentExpression(
          "profile_ig",
          "instagram_followers",
          "instagram_followers_past",
          "instagram_has_past",
        ),
        "instagram_followers_change_percent",
      ),
      "profile_tt.tiktok_followers",
      rawAs<string | null, "tiktok_followers_change">(
        changeExpression(
          "profile_tt",
          "tiktok_followers",
          "tiktok_followers_past",
          "tiktok_has_past",
        ),
        "tiktok_followers_change",
      ),
      rawAs<number | null, "tiktok_followers_change_percent">(
        changePercentExpression(
          "profile_tt",
          "tiktok_followers",
          "tiktok_followers_past",
          "tiktok_has_past",
        ),
        "tiktok_followers_change_percent",
      ),
      "profile_verified.is_verified",
    ])
    .where("profile_type", "eq", "musician")
    .where("vertical", "eq", "music")
    .where("active", "eq", "true")
    .whereNull("deleted_at")) satisfies MetricsQueryFactory;

const listArtists = ((database, query) => {
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";
  const periodDays = changePeriodDays[query.changePeriod ?? "7d"];

  return database
    .table("new_vertical.cm_artist")
    .withCTE("latest_ig", latestInstagramSnapshots(database, periodDays))
    .withCTE("latest_tt", latestTiktokSnapshots(database, periodDays))
    .withCTE("profile_ig", instagramFollowersByProfile(database))
    .withCTE("profile_tt", tiktokFollowersByProfile(database))
    .withCTE("latest_score", latestCmScores(database, periodDays))
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
      "artist_metrics.cm_score_change",
      "artist_metrics.cm_score_change_percent",
      "artist_metrics.instagram_followers",
      "artist_metrics.instagram_followers_change",
      "artist_metrics.instagram_followers_change_percent",
      "artist_metrics.tiktok_followers",
      "artist_metrics.tiktok_followers_change",
      "artist_metrics.tiktok_followers_change_percent",
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
      max_rows_to_read: 500_000_000,
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

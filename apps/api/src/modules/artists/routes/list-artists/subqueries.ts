import { rawAs } from "@hypequery/clickhouse";

import type {
  GenreQueryFactory,
  MetricsQueryFactory,
  PeriodQueryFactory,
} from "./types.ts";

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

export const latestInstagramSnapshots = ((database, periodDays) =>
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
    .max("is_verified", "instagram_verified")
    .groupBy("account_id")) satisfies PeriodQueryFactory;

export const latestTiktokSnapshots = ((database, periodDays) =>
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
    .max("is_verified", "tiktok_verified")
    .groupBy("account_id")) satisfies PeriodQueryFactory;

export const instagramFollowersByProfile = ((database) =>
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
    .max("latest_ig.instagram_verified", "instagram_verified")
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

export const tiktokFollowersByProfile = ((database) =>
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
    .max("latest_tt.tiktok_verified", "tiktok_verified")
    .whereNull("disconnected_at")
    .groupBy("profile_id")) satisfies MetricsQueryFactory;

export const latestCmScores = ((database, periodDays) =>
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

// A profile counts as verified when any of its accounts says so: one profile
// can carry several accounts per platform, so latest-snapshot semantics would
// arbitrarily pick an unverified fan account.
//
// `profile_snapshots` also carries this flag, but it holds five platforms of
// full history and cannot prune on `platform`, so reading it costs a full scan.
const VERIFIED_EXPRESSION =
  "greatest(ifNull(profile_ig.instagram_verified, 0), ifNull(profile_tt.tiktok_verified, 0))";

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

export const artistMetrics = ((database) =>
  database
    .table("new_vertical.profile")
    .final()
    .leftAnyJoin("latest_score", "id", "latest_score.profile_id")
    .leftAnyJoin("profile_ig", "id", "profile_ig.profile_id")
    .leftAnyJoin("profile_tt", "id", "profile_tt.profile_id")
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
      rawAs<number, "is_verified">(VERIFIED_EXPRESSION, "is_verified"),
    ])
    .where((predicate) =>
      predicate.fn<boolean>("has", predicate.col("profile_types"), predicate.value("musician")),
    )
    .where("vertical", "eq", "music")
    .where("active", "eq", "true")
    .whereNull("deleted_at")) satisfies MetricsQueryFactory;

// An empty slug list pins the CTE to a non-existent tag_type so the join stays
// declared (keeping one static query shape) while reading zero rows.
export const genreArtists = ((database, slugs) => {
  const builder = database
    .table("new_vertical.l_cm_artist_tag")
    .select(["cm_artist"])
    .groupBy("cm_artist");

  return slugs.length === 0
    ? builder.where("tag_type", "eq", "none")
    : builder.where("tag_type", "eq", "genre").where("tag_slug", "in", slugs);
}) satisfies GenreQueryFactory;

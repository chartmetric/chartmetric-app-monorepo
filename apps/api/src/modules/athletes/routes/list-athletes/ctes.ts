import { rawAs } from "@hypequery/clickhouse";

import type { DatabaseQueryFactory } from "../../../../lib/database.ts";

// Each subquery is a governed builder, so `generate:ch-schema` discovers its
// table. Two expressions have no builder form and stay raw — the ranking window
// function, and `argMax` over a JSON extraction, which takes a column rather than
// an expression. Both are constant SQL that no request value reaches.

// `rank` mirrors the athlete's standing across the whole active roster, so it is
// computed before any request filter narrows the set — a filtered page shows
// non-contiguous global ranks rather than renumbering from 1.
export const selectRosterRank = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    .select([
      "profile_id",
      rawAs<number, "athlete_rank">(
        "row_number() OVER (ORDER BY ig_followers DESC NULLS LAST, profile_id ASC)",
        "athlete_rank",
      ),
    ])) satisfies DatabaseQueryFactory;

// TikTok post and like counts exist only as snapshot history; the cache carries
// followers, hearts, and videos but never these two.
// `.final()` first because `snapshot_date` is part of this table's sorting key:
// two versions of one snapshot tie on the `argMax` argument, so without it the
// stale row can win.
export const selectTiktokLatest = ((database) =>
  database
    .table("new_vertical.profile_snapshots")
    .final()
    .where("platform", "eq", "tiktok")
    .groupBy("profile_id")
    .select(["profile_id"])
    .argMax("posts", "snapshot_date", "tiktok_posts")
    .argMax("likes", "snapshot_date", "tiktok_likes")
    .argMax(
      "followers",
      "snapshot_date",
      "tiktok_snapshot_followers",
    )) satisfies DatabaseQueryFactory;

// An appearance with no minutes played is not "last game" evidence, and a
// scheduled fixture is not a played one.
export const selectLastMatch = ((database) =>
  database
    .table("new_vertical.athletes_football_fixture_player_stats_apifootball")
    .final()
    .where("profile_id", "neq", 0)
    .whereNotNull("minutes")
    .where("minutes", "gt", 0)
    .where((predicate) =>
      predicate.fn<boolean>(
        "lessOrEquals",
        predicate.col("match_date"),
        predicate.fn<string>("today"),
      ),
    )
    .groupBy("profile_id")
    .select(["profile_id"])
    .max("match_date", "last_match_date")) satisfies DatabaseQueryFactory;

// `updated_at` is outside this table's sorting key, so `argMax` over it already
// returns the newest version of a row. That is what `.final()` would do here, at
// less cost, and it applies to the ESPN subquery below too.
export const selectOn3School = ((database) =>
  database
    .table("new_vertical.profile_sport_external_ids")
    .where("provider", "eq", "on3")
    .whereNotNull("metadata")
    .groupBy("profile_id")
    .select([
      "profile_id",
      rawAs<string, "school">(
        "argMax(JSONExtractString(assumeNotNull(metadata), 'school'), updated_at)",
        "school",
      ),
    ])) satisfies DatabaseQueryFactory;

// Basketball crests are absent from the football team catalog; the provider's
// external-id metadata carries the league and team abbreviation that ESPN's
// public logo path is built from.
export const selectEspnBasketball = ((database) =>
  database
    .table("new_vertical.profile_sport_external_ids")
    .where("provider", "eq", "espn")
    .where("sport", "eq", "basketball")
    .whereNotNull("metadata")
    .groupBy("profile_id")
    .select([
      "profile_id",
      rawAs<string, "espn_league">(
        "argMax(JSONExtractString(assumeNotNull(metadata), 'league'), updated_at)",
        "espn_league",
      ),
      rawAs<string, "espn_team_abbr">(
        "argMax(JSONExtractString(assumeNotNull(metadata), 'team_abbr'), updated_at)",
        "espn_team_abbr",
      ),
    ])) satisfies DatabaseQueryFactory;

// Both caches are sorted by `profile_id`, so `.final()` is enough to leave one
// row per athlete. They are read through a CTE because a joined table cannot
// carry `FINAL` of its own.
export const selectGpsScores = ((database) =>
  database
    .table("new_vertical.athletes_football_gps_scores_football_cache")
    .final()
    .select([
      "profile_id",
      "gps",
      "gps_atk",
      "gps_def",
    ])) satisfies DatabaseQueryFactory;

export const selectMomentum = ((database) =>
  database
    .table("new_vertical.athletes_football_momentum_football_cache")
    .final()
    .select([
      "profile_id",
      "momentum",
      "momentum_label",
    ])) satisfies DatabaseQueryFactory;

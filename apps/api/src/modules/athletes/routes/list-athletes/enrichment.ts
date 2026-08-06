import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  JoinableChain,
  TablesWithColumn,
} from "../../../../lib/database.ts";
import type { CteAlias } from "./types.ts";

// `rank` mirrors the athlete's standing across the whole active roster, so it is
// computed before any request filter narrows the set — a filtered page shows
// non-contiguous global ranks rather than renumbering from 1.
const selectRosterRank = ((database) =>
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
const selectTiktokLatest = ((database) =>
  database
    .table("new_vertical.profile_snapshots")
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
const selectLastMatch = ((database) =>
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

const selectOn3School = ((database) =>
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
const selectEspnBasketball = ((database) =>
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

const ENRICHMENT_CTES = [
  ["roster_rank", selectRosterRank],
  ["tiktok_latest", selectTiktokLatest],
  ["last_match", selectLastMatch],
  ["on3_school", selectOn3School],
  ["espn_basketball", selectEspnBasketball],
] as const satisfies readonly (readonly [CteAlias, DatabaseQueryFactory])[];

/**
 * Join order is the CTEs first, then the warehouse tables that already carry one
 * row per profile. `satisfies` checks each warehouse name against the generated
 * schema and rejects a table with no `profile_id` to join on.
 */
export const ENRICHMENT_JOINS = [
  "roster_rank",
  "tiktok_latest",
  "last_match",
  "on3_school",
  "espn_basketball",
  "new_vertical.athletes_basketball",
  "new_vertical.athletes_football_gps_scores_football_cache",
  "new_vertical.athletes_football_momentum_football_cache",
] as const satisfies readonly (CteAlias | TablesWithColumn<"profile_id">)[];

const CACHE_PROFILE_ID = "new_vertical.athletes_cache.profile_id";

const CTE_FACTORIES = new Map<string, DatabaseQueryFactory>(ENRICHMENT_CTES);

export type EnrichmentSource = (typeof ENRICHMENT_JOINS)[number];

/**
 * Joins the requested enrichment sources onto the roster, CTEs registered first
 * so a join can name one.
 *
 * `LEFT ANY JOIN` keeps one row per athlete even where a source has duplicates,
 * and `join_use_nulls` (set on the outer query) keeps an absent row null rather
 * than zero. Because the join cannot add or remove a roster row, a query that
 * only counts needs the sources its filters read and nothing else — passing
 * fewer here is a cost decision, never a correctness one.
 */
export const withEnrichment = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
  sources: readonly EnrichmentSource[] = ENRICHMENT_JOINS,
): Builder => {
  let next = builder as unknown as JoinableChain;

  for (const source of sources) {
    const buildCte = CTE_FACTORIES.get(source);

    if (buildCte !== undefined) next = next.withCTE(source, buildCte(database));
  }
  for (const source of sources) {
    next = next.leftAnyJoin(source, CACHE_PROFILE_ID, `${source}.profile_id`);
  }

  return next as unknown as Builder;
};

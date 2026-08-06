import type { ClickHouseDatabase } from "../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  JoinableChain,
} from "../../../lib/database.ts";

export const BASKETBALL_ROSTER = "basketball_roster";

/**
 * One basketball row per athlete, newest first.
 *
 * `athletes_basketball` is sorted by `id` rather than `profile_id`, so
 * `ReplacingMergeTree` treats two rows for the same athlete as distinct and
 * `.final()` alone cannot collapse them. Every consumer joins on `profile_id`,
 * which would otherwise take an arbitrary row and report a stale team, league, or
 * position. `.final()` first picks the newest version of each `id`; `argMax` then
 * picks the newest `id` for the athlete.
 */
const selectBasketballRoster = ((database) =>
  database
    .table("new_vertical.athletes_basketball")
    .final()
    .groupBy("profile_id")
    .select(["profile_id"])
    .argMax("team", "updated_at", "basketball_team")
    .argMax("league", "updated_at", "basketball_league")
    .argMax(
      "position",
      "updated_at",
      "basketball_position",
    )) satisfies DatabaseQueryFactory;

const CACHE_PROFILE_ID = "new_vertical.athletes_cache.profile_id";

/**
 * Registers the roster subquery and joins it to `athletes_cache`. Callers read
 * its columns as `basketball_roster.basketball_*`, which the generated schema
 * cannot describe, so they select them with `rawAs`.
 */
export const withBasketballRoster = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
): Builder => {
  const next = (builder as unknown as JoinableChain)
    .withCTE(BASKETBALL_ROSTER, selectBasketballRoster(database))
    .leftAnyJoin(
      BASKETBALL_ROSTER,
      CACHE_PROFILE_ID,
      `${BASKETBALL_ROSTER}.profile_id`,
    );

  return next as unknown as Builder;
};

export { selectBasketballRoster };

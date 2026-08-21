import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { ListLeaguesQuery } from "./schemas.ts";
import type {
  KeyAthleteTuple,
  LeagueCatalogBuilder,
  LeagueCountRow,
  LeagueListRow,
} from "./types.ts";

import {
  applyWhen,
  type DatabaseQueryFactory,
  type ExecutableQuery,
  type JoinableChain,
  orderByExpression,
} from "../../../../lib/database.ts";
import { resolveSortDirection } from "../../../../lib/sorting.ts";

const CATALOG = "new_vertical.leagues";
const AGGREGATE = "league_athletes";
const TEAM_NAMES = "football_team_names";
const CLUB_LEAGUES = "football_club_leagues";
const VERTICAL = "sports";

const COLUMN = {
  externalId: "new_vertical.leagues.external_id",
  id: "new_vertical.leagues.id",
  name: "new_vertical.leagues.name",
  sport: "new_vertical.leagues.sport",
  vertical: "new_vertical.leagues.vertical",
} as const;

const AGGREGATE_COLUMN = {
  aggregatedIgFollowers: "league_athletes.aggregated_ig_followers",
  key: "league_athletes.league_key",
  keyAthletes: "league_athletes.key_athletes",
  maxIgFollowers: "league_athletes.max_ig_followers",
  nationalities: "league_athletes.nationalities",
  trackedAthletes: "league_athletes.tracked_athletes",
} as const;

const MEGA_IG_FOLLOWERS = 100_000_000;

/**
 * DATA-FIX-ME: interim league membership key, matched to `leagues.external_id`.
 * `athletes_cache` carries no league id, so football membership is derived by
 * matching the free-text `football_club` against the provider's team names and
 * reading each matched team's competitions — an athlete whose stored spelling
 * differs from the provider's ("PSG" vs "Paris Saint Germain") silently drops
 * out. Basketball and tennis ride on their source label lowercasing to the
 * catalog's `external_id` ("NBA" → "nba", "ATP" → "atp"). Replace both paths
 * with an ingested athlete-to-league id once the data team provides one.
 */
const LEAGUE_KEY = `if(${CLUB_LEAGUES}.competition_id != 0, toString(${CLUB_LEAGUES}.competition_id), lowerUTF8(coalesce(nullIf(basketball_league, ''), nullIf(tennis_tour, ''), '')))`;

// No builder form: an ordered slice over a grouped array. Ties on followers
// break by profile_id so the chips a league shows are stable between requests.
const KEY_ATHLETES =
  "arrayMap(entry -> (entry.2, entry.3), arraySlice(arraySort(entry -> (-entry.1, entry.2), groupArray((ifNull(ig_followers, 0), profile_id, name))), 1, 5))";

const NATIONALITIES = "groupUniqArray(nationality)";

// `metadata` is a JSON document rather than a column set; absent keys and an
// absent document both extract as ''.
const COUNTRY_FLAG_URL =
  "JSONExtractString(ifNull(new_vertical.leagues.metadata, ''), 'country_flag_url')";

// `teams_apifootball` is a ReplacingMergeTree sorted by `team_id`; a join
// target cannot carry FINAL, so argMax over the load version reproduces it.
const selectFootballTeamNames = ((database) =>
  database
    .table("new_vertical.teams_apifootball")
    .select([
      "team_id",
      rawAs<string, "club_name">(
        "ifNull(argMax(name, _loaded_at), '')",
        "club_name",
      ),
    ])
    .groupBy("team_id")) satisfies DatabaseQueryFactory;

// One row per (club name, competition): grouping collapses both the
// ReplacingMergeTree duplicates of `l_team_competition_apifootball` and its
// per-season rows, and same-named clubs keep the union of their competitions
// rather than an arbitrary pick.
const selectFootballClubLeagues = ((database) => {
  const base = database.table("new_vertical.l_team_competition_apifootball");

  return (
    (base as unknown as JoinableChain).leftAnyJoin(
      TEAM_NAMES,
      "new_vertical.l_team_competition_apifootball.team_id",
      `${TEAM_NAMES}.team_id`,
    ) as unknown as typeof base
  )
    .where((predicate) =>
      predicate.fn<boolean>(
        "notEquals",
        predicate.raw(`${TEAM_NAMES}.club_name`),
        predicate.value(""),
      ),
    )
    .select([
      // A CTE column is invisible to the builder's schema; the reference must
      // go through rawAs like the join above goes through JoinableChain.
      rawAs<string, "club_name">(`${TEAM_NAMES}.club_name`, "club_name"),
      "competition_id",
    ])
    .groupBy(["club_name", "competition_id"]);
}) satisfies DatabaseQueryFactory;

const selectLeagueAthletes = ((database) => {
  const base = database.table("new_vertical.athletes_cache").final();

  // A plain LEFT JOIN on purpose: a club plays in several competitions at
  // once, and its athletes must count toward every one of them.
  return (
    (base as unknown as JoinableChain).leftJoin(
      CLUB_LEAGUES,
      "new_vertical.athletes_cache.football_club",
      `${CLUB_LEAGUES}.club_name`,
    ) as unknown as typeof base
  )
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    .where((predicate) =>
      predicate.fn<boolean>(
        "notEquals",
        predicate.raw("league_key"),
        predicate.value(""),
      ),
    )
    .select([
      rawAs<string, "league_key">(LEAGUE_KEY, "league_key"),
      rawAs<KeyAthleteTuple[], "key_athletes">(KEY_ATHLETES, "key_athletes"),
      rawAs<string[], "nationalities">(NATIONALITIES, "nationalities"),
    ])
    .groupBy("league_key")
    .count("profile_id", "tracked_athletes")
    .sum("ig_followers", "aggregated_ig_followers")
    .max("ig_followers", "max_ig_followers");
}) satisfies DatabaseQueryFactory;

export const selectLeagueCatalog = ((database) =>
  database
    .table(CATALOG)
    .final()
    .where((predicate) =>
      predicate.fn<boolean>(
        "equals",
        predicate.col(COLUMN.vertical),
        predicate.value(VERTICAL),
      ),
    )) satisfies DatabaseQueryFactory;

// Joining on `external_id` alone assumes the catalog's providers never share
// an id — true today ('nba'/'wnba', 'atp'/'wta', numeric apifootball ids,
// fifa's 'men') and gone with the interim key scheme above.
const withLeagueAthletes = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
): Builder =>
  (builder as unknown as JoinableChain)
    .withCTE(TEAM_NAMES, selectFootballTeamNames(database))
    .withCTE(CLUB_LEAGUES, selectFootballClubLeagues(database))
    .withCTE(AGGREGATE, selectLeagueAthletes(database))
    .leftAnyJoin(
      AGGREGATE,
      COLUMN.externalId,
      AGGREGATE_COLUMN.key,
    ) as unknown as Builder;

const applyNameFilter = (
  builder: LeagueCatalogBuilder,
  name: string,
): LeagueCatalogBuilder =>
  builder.where((predicate) =>
    predicate.fn<boolean>(
      "notEquals",
      predicate.fn<number>(
        "positionCaseInsensitiveUTF8",
        predicate.col(COLUMN.name),
        predicate.value(name),
      ),
      predicate.value(0),
    ),
  );

// The catalog stores sports lowercase; matching case-insensitively keeps a
// developer-API caller from having to know that.
const applySportFilter = (
  builder: LeagueCatalogBuilder,
  sports: readonly string[],
): LeagueCatalogBuilder =>
  builder.where((predicate) =>
    predicate.fn<boolean>(
      "has",
      predicate.array(sports.map((sport) => sport.toLowerCase())),
      predicate.fn<string>("lowerUTF8", predicate.col(COLUMN.sport)),
    ),
  );

// A league nobody tracks has no row in the aggregate, and `sum`/`max` over a
// Nullable column stay Nullable even where one does. Reading the joined column
// through `ifNull` makes an untracked league fail the threshold rather than
// compare as NULL.
const applyAggregateMinimum = (
  builder: LeagueCatalogBuilder,
  column: string,
  minimum: number,
): LeagueCatalogBuilder =>
  builder.where((predicate) =>
    predicate.fn<boolean>(
      "greaterOrEquals",
      predicate.fn<number>("ifNull", predicate.raw(column), predicate.value(0)),
      predicate.value(minimum),
    ),
  );

const applyFilters = (
  builder: LeagueCatalogBuilder,
  query: ListLeaguesQuery,
): LeagueCatalogBuilder => {
  let next = builder;

  next = applyWhen(next, query.name, applyNameFilter);
  next = applyWhen(next, query.sports, applySportFilter);
  next = applyWhen(next, query.minTrackedAthletes, (b, minimum) =>
    applyAggregateMinimum(b, AGGREGATE_COLUMN.trackedAthletes, minimum),
  );
  next = applyWhen(next, query.minAggregatedIgFollowers, (b, minimum) =>
    applyAggregateMinimum(b, AGGREGATE_COLUMN.aggregatedIgFollowers, minimum),
  );
  next = applyWhen(next, query.megaOnly === true ? true : undefined, (b) =>
    applyAggregateMinimum(
      b,
      AGGREGATE_COLUMN.maxIgFollowers,
      MEGA_IG_FOLLOWERS,
    ),
  );

  return next;
};

const CATALOG_SELECTIONS = [
  // UInt64 ids run past the range a JSON number holds exactly.
  rawAs<string, "id">("toString(new_vertical.leagues.id)", "id"),
  "new_vertical.leagues.name AS name",
  "new_vertical.leagues.sport AS sport",
  "new_vertical.leagues.league_type AS league_type",
  "new_vertical.leagues.scope AS scope",
  "new_vertical.leagues.logo_url AS logo_url",
  rawAs<string, "country_flag_url">(COUNTRY_FLAG_URL, "country_flag_url"),
  rawAs<number, "tracked_athletes">(
    AGGREGATE_COLUMN.trackedAthletes,
    "tracked_athletes",
  ),
  rawAs<number, "aggregated_ig_followers">(
    AGGREGATE_COLUMN.aggregatedIgFollowers,
    "aggregated_ig_followers",
  ),
  rawAs<KeyAthleteTuple[], "key_athletes">(
    AGGREGATE_COLUMN.keyAthletes,
    "key_athletes",
  ),
  rawAs<string[], "nationalities">(
    AGGREGATE_COLUMN.nationalities,
    "nationalities",
  ),
] as const;

const DEFAULT_SORT_BY = "name";

const ASCENDING_FIRST: ReadonlySet<string> = new Set(["name", "sport"]);

const SORT_COLUMNS = {
  igReach: `ifNull(${AGGREGATE_COLUMN.aggregatedIgFollowers}, 0)`,
  name: COLUMN.name,
  sport: COLUMN.sport,
  trackedAthletes: "tracked_athletes",
} as const;

const QUERY_SETTINGS = {
  max_execution_time: 30,
  max_rows_to_read: 50_000_000,
  timeout_before_checking_execution_speed: 0,
} as const;

const sortBy = (query: ListLeaguesQuery): keyof typeof SORT_COLUMNS =>
  query.sortBy ?? DEFAULT_SORT_BY;

const sortDirection = (query: ListLeaguesQuery): "ASC" | "DESC" =>
  resolveSortDirection(query.sortDirection, sortBy(query), ASCENDING_FIRST);

const listLeagues = (
  database: ClickHouseDatabase,
  query: ListLeaguesQuery,
): ExecutableQuery<LeagueListRow> => {
  const joined = withLeagueAthletes(
    applyFilters(selectLeagueCatalog(database), query),
    database,
  );

  return orderByExpression(
    joined.select(CATALOG_SELECTIONS),
    SORT_COLUMNS[sortBy(query)],
    sortDirection(query),
  )
    .orderBy(COLUMN.id, "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<LeagueListRow>;
};

// The count keeps the aggregate join the list query uses: every threshold
// filter reads a column that only exists on the joined side, and a LEFT ANY
// JOIN cannot change how many catalog rows match.
const countLeagues = (
  database: ClickHouseDatabase,
  query: ListLeaguesQuery,
): ExecutableQuery<LeagueCountRow> =>
  withLeagueAthletes(
    applyFilters(selectLeagueCatalog(database), query),
    database,
  )
    .select([rawAs<number, "total">("count()", "total")])
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<LeagueCountRow>;

export const createListLeaguesQueries = (
  database: ClickHouseDatabase,
): {
  countLeagues: (query: ListLeaguesQuery) => ExecutableQuery<LeagueCountRow>;
  listLeagues: (query: ListLeaguesQuery) => ExecutableQuery<LeagueListRow>;
} => ({
  countLeagues: (query) => countLeagues(database, query),
  listLeagues: (query) => listLeagues(database, query),
});

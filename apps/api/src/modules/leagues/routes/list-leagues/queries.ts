import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  ExecutableQuery,
  JoinableChain,
  OrderableChain,
} from "../../../../lib/database.ts";
import type { ListLeaguesQuery } from "./schemas.ts";
import type {
  KeyAthleteTuple,
  LeagueCatalogBuilder,
  LeagueCountRow,
  LeagueListRow,
} from "./types.ts";

const CATALOG = "new_vertical.leagues";
const AGGREGATE = "league_athletes";
const VERTICAL = "sports";

const COLUMN = {
  id: "new_vertical.leagues.id",
  name: "new_vertical.leagues.name",
  sport: "new_vertical.leagues.sport",
  vertical: "new_vertical.leagues.vertical",
} as const;

const AGGREGATE_COLUMN = {
  aggregatedIgFollowers: "league_athletes.aggregated_ig_followers",
  keyAthletes: "league_athletes.key_athletes",
  label: "league_athletes.league_label",
  maxIgFollowers: "league_athletes.max_ig_followers",
  nationalities: "league_athletes.nationalities",
  trackedAthletes: "league_athletes.tracked_athletes",
} as const;

const MEGA_IG_FOLLOWERS = 100_000_000;

/**
 * Interim league join key. `athletes_cache` carries no league identifier, only
 * the label its ingesting source wrote: `football_league` and
 * `basketball_league` reproduce `leagues.name` exactly, while tennis stores the
 * bare tour ("ATP") that the catalog names "ATP Tour". Replace this with an
 * athlete-to-league id once one exists.
 */
const LEAGUE_LABEL =
  "coalesce(nullIf(football_league, ''), nullIf(basketball_league, ''), concat(nullIf(tennis_tour, ''), ' Tour'), '')";

// No builder form: an ordered slice over a grouped array. Ties on followers
// break by profile_id so the chips a league shows are stable between requests.
const KEY_ATHLETES =
  "arrayMap(entry -> (entry.2, entry.3), arraySlice(arraySort(entry -> (-entry.1, entry.2), groupArray((ifNull(ig_followers, 0), profile_id, name))), 1, 5))";

const NATIONALITIES = "groupUniqArray(nationality)";

// `metadata` is a JSON document rather than a column set; absent keys and an
// absent document both extract as ''.
const COUNTRY_FLAG_URL =
  "JSONExtractString(ifNull(new_vertical.leagues.metadata, ''), 'country_flag_url')";

const selectLeagueAthletes = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    .where((predicate) =>
      predicate.fn<boolean>(
        "notEquals",
        predicate.raw("league_label"),
        predicate.value(""),
      ),
    )
    .select([
      rawAs<string, "league_label">(LEAGUE_LABEL, "league_label"),
      rawAs<KeyAthleteTuple[], "key_athletes">(KEY_ATHLETES, "key_athletes"),
      rawAs<string[], "nationalities">(NATIONALITIES, "nationalities"),
    ])
    .groupBy("league_label")
    .count("profile_id", "tracked_athletes")
    .sum("ig_followers", "aggregated_ig_followers")
    .max("ig_followers", "max_ig_followers")) satisfies DatabaseQueryFactory;

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

// hypequery cannot type a CTE alias as a join source or a qualified left
// column, so the join goes through the structural escape hatch. Both mistakes
// typecheck, which is why every variant of this query is run against real
// ClickHouse.
const withLeagueAthletes = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
): Builder =>
  (builder as unknown as JoinableChain)
    .withCTE(AGGREGATE, selectLeagueAthletes(database))
    .leftAnyJoin(
      AGGREGATE,
      COLUMN.name,
      AGGREGATE_COLUMN.label,
    ) as unknown as Builder;

const orderByExpression = <Builder>(
  builder: Builder,
  expression: string,
  direction: "ASC" | "DESC",
): Builder =>
  (builder as unknown as OrderableChain).orderBy(
    expression,
    direction,
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

  if (query.name !== undefined) next = applyNameFilter(next, query.name);
  if (query.sports !== undefined) next = applySportFilter(next, query.sports);
  if (query.minTrackedAthletes !== undefined) {
    next = applyAggregateMinimum(
      next,
      AGGREGATE_COLUMN.trackedAthletes,
      query.minTrackedAthletes,
    );
  }
  if (query.minAggregatedIgFollowers !== undefined) {
    next = applyAggregateMinimum(
      next,
      AGGREGATE_COLUMN.aggregatedIgFollowers,
      query.minAggregatedIgFollowers,
    );
  }
  if (query.megaOnly === true) {
    next = applyAggregateMinimum(
      next,
      AGGREGATE_COLUMN.maxIgFollowers,
      MEGA_IG_FOLLOWERS,
    );
  }

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

// `sum` over a Nullable column stays Nullable and an unmatched join row is NULL
// as well, and ClickHouse parks NULLs at one end whichever direction is asked
// for. Ordering reach through the same `ifNull` the threshold filter reads keeps
// the sort agreeing with the zero the reply reports. `count` cannot be NULL, so
// `tracked_athletes` already sorts an untracked league as the zero it returns.
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

// An explicit request wins; otherwise the useful first look depends on the
// column. Names and sports start ascending, athlete counts and reach
// descending, so `sortBy=trackedAthletes` returns the deepest leagues rather
// than the emptiest.
const sortDirection = (query: ListLeaguesQuery): "ASC" | "DESC" => {
  const requested =
    query.sortDirection ??
    (ASCENDING_FIRST.has(sortBy(query)) ? "asc" : "desc");

  return requested === "asc" ? "ASC" : "DESC";
};

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

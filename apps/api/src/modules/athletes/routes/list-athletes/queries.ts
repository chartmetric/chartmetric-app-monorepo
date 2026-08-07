import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { ExecutableQuery } from "../../../../lib/database.ts";
import type { ListAthletesQuery } from "./schemas.ts";
import type {
  AthleteCountRow,
  AthleteListRow,
  CteAlias,
  ListAthletesOptions,
  RosterBuilder,
} from "./types.ts";

import { withEnrichment } from "./enrichment.ts";
import { applyFilters, selectRoster } from "./filters.ts";

const CACHE = "new_vertical.athletes_cache";

const CACHE_COLUMNS = [
  `${CACHE}.profile_id AS profile_id`,
  `${CACHE}.name AS name`,
  `${CACHE}.sport AS sport`,
  `${CACHE}.nationality AS nationality`,
  `${CACHE}.image_url AS image_url`,
  `${CACHE}.cm_score AS cm_score`,
  `${CACHE}.date_of_birth AS date_of_birth`,
  `${CACHE}.turned_pro_year AS turned_pro_year`,
  `${CACHE}.football_club AS football_club`,
  `${CACHE}.football_position AS football_position`,
  `${CACHE}.football_national_team AS football_national_team`,
  `${CACHE}.tennis_tour AS tennis_tour`,
  `${CACHE}.tennis_ranking AS tennis_ranking`,
  `${CACHE}.ig_followers AS ig_followers`,
  `${CACHE}.ig_posts AS ig_posts`,
  `${CACHE}.ig_verified AS ig_verified`,
  `${CACHE}.ig_engagement_rate AS ig_engagement_rate`,
  `${CACHE}.ig_handle AS ig_handle`,
  `${CACHE}.tiktok_hearts AS tiktok_hearts`,
  `${CACHE}.tiktok_videos AS tiktok_videos`,
  `${CACHE}.tiktok_handle AS tiktok_handle`,
  `${CACHE}.youtube_handle AS youtube_handle`,
  `${CACHE}.twitter_handle AS twitter_handle`,
  `${CACHE}.facebook_handle AS facebook_handle`,
] as const;

const JOINED_COLUMNS = [
  ["roster_rank.athlete_rank", "athlete_rank"],
  ["tiktok_latest.tiktok_posts", "snapshot_tiktok_posts"],
  ["tiktok_latest.tiktok_likes", "snapshot_tiktok_likes"],
  // The cache is authoritative but backfilled on a delay, so snapshot history
  // stands in while it is still unset or zero. Computed here rather than in the
  // mapper so the sort and the displayed value cannot disagree.
  [
    `nullIf(ifNull(nullIf(${CACHE}.tiktok_followers, 0), tiktok_latest.tiktok_snapshot_followers), 0)`,
    "tiktok_followers",
  ],
  ["last_match.last_match_date", "last_match_date"],
  ["on3_school.school", "on3_school"],
  ["espn_basketball.espn_league", "espn_league"],
  ["espn_basketball.espn_team_abbr", "espn_team_abbr"],
  ["basketball_roster.basketball_team", "basketball_team"],
  ["basketball_roster.basketball_league", "basketball_league"],
  ["basketball_roster.basketball_position", "basketball_position"],
  ["gps_scores.gps", "gps"],
  ["gps_scores.gps_atk", "gps_atk"],
  ["gps_scores.gps_def", "gps_def"],
  ["momentum_scores.momentum", "momentum"],
  ["momentum_scores.momentum_label", "momentum_label"],
] as const satisfies readonly (readonly [string, keyof AthleteListRow])[];

const joinedSelections = JOINED_COLUMNS.map(([expression, alias]) =>
  rawAs(expression, alias),
);

const DEFAULT_SORT_BY = "rank";

const ASCENDING_FIRST: ReadonlySet<string> = new Set([
  "name",
  "nationality",
  "rank",
  "sport",
  "type",
]);

const SORT_COLUMNS = {
  cmScore: `${CACHE}.cm_score`,
  igFollowers: `${CACHE}.ig_followers`,
  igPosts: `${CACHE}.ig_posts`,
  name: `${CACHE}.name`,
  nationality: `${CACHE}.nationality`,
  rank: "athlete_rank",
  sport: `${CACHE}.sport`,
  tiktokFollowers: "tiktok_followers",
  tiktokLikes: "snapshot_tiktok_likes",
} as const;

// join_use_nulls keeps an absent enrichment row as NULL instead of ClickHouse's
// default zero, which the contract relies on to distinguish "no GPS score" from
// a genuine score of 0.
const QUERY_SETTINGS = {
  join_use_nulls: 1,
  max_execution_time: 60,
  max_rows_to_read: 50_000_000,
  timeout_before_checking_execution_speed: 0,
} as const;

/**
 * The enrichment sources a filter reads, so the count can skip the rest: a
 * `LEFT ANY JOIN` cannot change how many roster rows match, and no other filter
 * looks outside `athletes_cache`.
 */
const filteredSources = (query: ListAthletesQuery): CteAlias[] => {
  const sources = new Set<CteAlias>();

  if (query.leagues !== undefined) sources.add("basketball_roster");
  if (query.clubs !== undefined) {
    sources.add("on3_school");
    sources.add("basketball_roster");
  }

  return [...sources];
};

const sortBy = (query: ListAthletesQuery): keyof typeof SORT_COLUMNS =>
  query.sortBy ?? DEFAULT_SORT_BY;

const sortDirection = (query: ListAthletesQuery): "ASC" | "DESC" => {
  const requested =
    query.sortDirection ??
    (ASCENDING_FIRST.has(sortBy(query)) ? "asc" : "desc");

  return requested === "asc" ? "ASC" : "DESC";
};

const selectEnrichedRoster = (
  database: ClickHouseDatabase,
  query: ListAthletesQuery,
  options: ListAthletesOptions,
): RosterBuilder =>
  withEnrichment(
    applyFilters(selectRoster(database), query, options),
    database,
  );

const listAthletes = (
  database: ClickHouseDatabase,
  query: ListAthletesQuery,
  options: ListAthletesOptions,
): ExecutableQuery<AthleteListRow> =>
  selectEnrichedRoster(database, query, options)
    .select([...CACHE_COLUMNS, ...joinedSelections])
    .orderBy(SORT_COLUMNS[sortBy(query)], sortDirection(query))
    .orderBy(`${CACHE}.profile_id`, "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<AthleteListRow>;

const countAthletes = (
  database: ClickHouseDatabase,
  query: ListAthletesQuery,
  options: ListAthletesOptions,
): ExecutableQuery<AthleteCountRow> =>
  withEnrichment(
    applyFilters(selectRoster(database), query, options),
    database,
    filteredSources(query),
  )
    .select([rawAs<number, "total">("count()", "total")])
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<AthleteCountRow>;

export const createListAthletesQueries = (
  database: ClickHouseDatabase,
): {
  countAthletes: (
    query: ListAthletesQuery,
    options?: ListAthletesOptions,
  ) => ExecutableQuery<AthleteCountRow>;
  listAthletes: (
    query: ListAthletesQuery,
    options?: ListAthletesOptions,
  ) => ExecutableQuery<AthleteListRow>;
} => ({
  countAthletes: (query, options = {}) =>
    countAthletes(database, query, options),
  listAthletes: (query, options = {}) => listAthletes(database, query, options),
});

export type { AthleteListRow, ListAthletesOptions } from "./types.ts";

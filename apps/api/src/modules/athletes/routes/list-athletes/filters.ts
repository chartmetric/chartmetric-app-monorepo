import type { DatabaseQueryFactory } from "../../../../lib/database.ts";
import type { ListAthletesQuery } from "./schemas.ts";
import type { ListAthletesOptions, RosterBuilder } from "./types.ts";

import { COLLEGE_SPORT_LIST } from "../../sport/classification.ts";

/**
 * Filters are applied to the roster builder but run on the fully joined query, so
 * every column reference is qualified. An unqualified name is ambiguous whenever
 * an enrichment source shares it — `name` and `nationality` both exist on the
 * momentum cache — and ClickHouse rejects the query rather than picking one.
 */
const COLUMN = {
  cmScore: "new_vertical.athletes_cache.cm_score",
  deletedAt: "new_vertical.athletes_cache.deleted_at",
  footballClub: "new_vertical.athletes_cache.football_club",
  igFollowers: "new_vertical.athletes_cache.ig_followers",
  igVerified: "new_vertical.athletes_cache.ig_verified",
  isActive: "new_vertical.athletes_cache.is_active",
  name: "new_vertical.athletes_cache.name",
  nationality: "new_vertical.athletes_cache.nationality",
  sport: "new_vertical.athletes_cache.sport",
} as const;

// Columns that arrive from a join or a CTE are not in the builder's type state,
// so they are referenced as raw SQL. All three are constant column names —
// request values still go through `predicate.value`.
const BASKETBALL_LEAGUE = "basketball_roster.basketball_league";
const BASKETBALL_TEAM = "basketball_roster.basketball_team";
const ON3_SCHOOL = "on3_school.school";
const TENNIS_TOUR = "new_vertical.athletes_cache.tennis_tour";

export const selectRoster = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .final()
    .where((predicate) =>
      predicate.fn<boolean>(
        "equals",
        predicate.col(COLUMN.isActive),
        predicate.value(1),
      ),
    )
    .where((predicate) =>
      predicate.fn<boolean>("isNull", COLUMN.deletedAt),
    )) satisfies DatabaseQueryFactory;

const applyComparison = (
  builder: RosterBuilder,
  column: (typeof COLUMN)[keyof typeof COLUMN],
  comparison: "equals" | "greaterOrEquals" | "lessOrEquals",
  value: number,
): RosterBuilder =>
  builder.where((predicate) =>
    predicate.fn<boolean>(
      comparison,
      predicate.col(column),
      predicate.value(value),
    ),
  );

const applyNameFilter = (builder: RosterBuilder, name: string): RosterBuilder =>
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

// Sports are matched case-insensitively because the same sport arrives as
// "football" from professional sources and "Football" from the college batch.
const applySportFilter = (
  builder: RosterBuilder,
  sports: readonly string[],
  isExcluded: boolean,
): RosterBuilder =>
  builder.where((predicate) => {
    const membership = predicate.fn<boolean>(
      "has",
      predicate.array(sports.map((sport) => sport.toLowerCase())),
      predicate.fn<string>("lowerUTF8", predicate.col(COLUMN.sport)),
    );

    return isExcluded ? predicate.fn<boolean>("not", membership) : membership;
  });

// The follower filters treat a missing count as zero so "under 1M" includes
// athletes with no Instagram account, matching the quick-filter labels.
const applyFollowerBound = (
  builder: RosterBuilder,
  bound: number,
  comparison: "greaterOrEquals" | "lessOrEquals",
): RosterBuilder =>
  builder.where((predicate) =>
    predicate.fn<boolean>(
      comparison,
      predicate.fn<number>(
        "ifNull",
        predicate.col(COLUMN.igFollowers),
        predicate.value(0),
      ),
      predicate.value(bound),
    ),
  );

const applyLevelFilter = (
  builder: RosterBuilder,
  isCollege: boolean,
): RosterBuilder =>
  builder.where((predicate) => {
    const membership = predicate.fn<boolean>(
      "has",
      predicate.array([...COLLEGE_SPORT_LIST]),
      predicate.col(COLUMN.sport),
    );

    return isCollege ? membership : predicate.fn<boolean>("not", membership);
  });

const applyLeagueFilter = (
  builder: RosterBuilder,
  leagues: readonly string[],
  clubNames: readonly string[],
): RosterBuilder =>
  builder.where((predicate) => {
    const branches = [
      predicate.fn<boolean>(
        "has",
        predicate.array([...clubNames]),
        predicate.col(COLUMN.footballClub),
      ),
      predicate.fn<boolean>(
        "has",
        predicate.array([...leagues]),
        predicate.raw(BASKETBALL_LEAGUE),
      ),
      predicate.fn<boolean>(
        "has",
        predicate.array([...leagues]),
        predicate.col(TENNIS_TOUR),
      ),
    ];

    if (leagues.includes("NCAA")) {
      branches.push(
        predicate.fn<boolean>(
          "has",
          predicate.array([...COLLEGE_SPORT_LIST]),
          predicate.col(COLUMN.sport),
        ),
      );
    }

    return predicate.or(branches);
  });

const applyClubFilter = (
  builder: RosterBuilder,
  clubs: readonly string[],
): RosterBuilder =>
  builder.where((predicate) =>
    predicate.or([
      predicate.fn<boolean>(
        "has",
        predicate.array([...clubs]),
        predicate.col(COLUMN.footballClub),
      ),
      predicate.fn<boolean>(
        "has",
        predicate.array([...clubs]),
        predicate.raw(BASKETBALL_TEAM),
      ),
      predicate.fn<boolean>(
        "has",
        predicate.array([...clubs]),
        predicate.raw(ON3_SCHOOL),
      ),
    ]),
  );

const applyCategoricalFilters = (
  builder: RosterBuilder,
  query: ListAthletesQuery,
): RosterBuilder => {
  let next = builder;

  if (query.sports !== undefined) {
    next = applySportFilter(next, query.sports, false);
  }
  if (query.excludeSports !== undefined) {
    next = applySportFilter(next, query.excludeSports, true);
  }
  if (query.nationalities !== undefined) {
    next = next.where(COLUMN.nationality, "in", query.nationalities);
  }
  if (query.excludeNationalities !== undefined) {
    next = next.where(COLUMN.nationality, "notIn", query.excludeNationalities);
  }

  return next;
};

const applyRangeFilters = (
  builder: RosterBuilder,
  query: ListAthletesQuery,
): RosterBuilder => {
  let next = builder;

  if (query.minCmScore !== undefined) {
    next = applyComparison(
      next,
      COLUMN.cmScore,
      "greaterOrEquals",
      query.minCmScore,
    );
  }
  if (query.maxCmScore !== undefined) {
    next = applyComparison(
      next,
      COLUMN.cmScore,
      "lessOrEquals",
      query.maxCmScore,
    );
  }
  if (query.minFollowers !== undefined) {
    next = applyFollowerBound(next, query.minFollowers, "greaterOrEquals");
  }
  if (query.maxFollowers !== undefined) {
    next = applyFollowerBound(next, query.maxFollowers, "lessOrEquals");
  }

  return next;
};

export const applyFilters = (
  builder: RosterBuilder,
  query: ListAthletesQuery,
  options: ListAthletesOptions,
): RosterBuilder => {
  let next = applyRangeFilters(applyCategoricalFilters(builder, query), query);

  if (query.name !== undefined) next = applyNameFilter(next, query.name);
  if (query.verified === true) {
    next = applyComparison(next, COLUMN.igVerified, "equals", 1);
  }
  // Selecting both levels is the same as not filtering by level at all.
  if (query.levels?.length === 1) {
    next = applyLevelFilter(next, query.levels[0] === "college");
  }
  if (query.leagues !== undefined) {
    next = applyLeagueFilter(
      next,
      query.leagues,
      options.leagueClubNames ?? [],
    );
  }
  if (query.clubs !== undefined) next = applyClubFilter(next, query.clubs);

  return next;
};

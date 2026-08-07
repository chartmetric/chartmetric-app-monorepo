import type { ClickHouseDatabase } from "../../../db/clickhouse/client.ts";
import type { DatabaseQueryFactory } from "../../../lib/database.ts";
import type { ClubCatalog, ClubCatalogQueries, ClubIndex } from "./types.ts";

import { buildClubIndex } from "./club-utilities.ts";

const CATALOG_SETTINGS = {
  max_execution_time: 30,
  max_rows_to_read: 5_000_000,
  timeout_before_checking_execution_speed: 0,
} as const;

const selectFootballTeams = ((database) =>
  database
    .table("new_vertical.teams_apifootball")
    .select(["team_id", "name", "logo_url"])
    .final()
    .limit(50_000)
    .settings(CATALOG_SETTINGS)) satisfies DatabaseQueryFactory;

// Restricted to men's domestic competitions so a club resolves to its league
// rather than to a national-team or worldwide cup competition.
const selectFootballCompetitions = ((database) =>
  database
    .table("new_vertical.competitions_apifootball")
    .select(["competition_id", "name"])
    .final()
    .where("gender", "eq", "men")
    .where("country", "neq", "World")
    .where("country", "neq", "")
    .limit(50_000)
    .settings(CATALOG_SETTINGS)) satisfies DatabaseQueryFactory;

const selectFootballTeamCompetitions = ((database) =>
  database
    .table("new_vertical.l_team_competition_apifootball")
    .select(["team_id", "competition_id"])
    .final()
    .limit(200_000)
    .settings(CATALOG_SETTINGS)) satisfies DatabaseQueryFactory;

const selectRosterClubNames = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .select(["football_club"])
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    .where("football_club", "isNotNull", undefined as never)
    .where("football_club", "neq", "")
    .groupBy("football_club")
    .limit(100_000)
    .settings(CATALOG_SETTINGS)) satisfies DatabaseQueryFactory;

export const createClubCatalogQueries = (
  database: ClickHouseDatabase,
): ClubCatalogQueries => ({
  listCompetitions: () => selectFootballCompetitions(database),
  listRosterClubNames: () => selectRosterClubNames(database),
  listTeamCompetitions: () => selectFootballTeamCompetitions(database),
  listTeams: () => selectFootballTeams(database),
});

// The team catalog is a slow-moving dimension of a few hundred rows, but
// resolving it costs four queries plus token matching over every distinct roster
// club name. Caching it keeps that off the per-request path; athlete rows
// themselves are never cached.
const CATALOG_TTL_MS = 5 * 60 * 1000;

const shared = new WeakMap<ClickHouseDatabase, ClubCatalog>();

export const clubCatalogFor = (database: ClickHouseDatabase): ClubCatalog => {
  const existing = shared.get(database);

  if (existing !== undefined) return existing;

  const catalog = createClubCatalog(database);

  shared.set(database, catalog);

  return catalog;
};

export const createClubCatalog = (
  database: ClickHouseDatabase,
  now: () => number = Date.now,
): ClubCatalog => {
  const queries = createClubCatalogQueries(database);
  let cached: { index: ClubIndex; loadedAt: number } | undefined;
  let inFlight: Promise<ClubIndex> | undefined;

  const loadAndCache = async (): Promise<ClubIndex> => {
    try {
      const [teams, competitions, teamCompetitions, clubNames] =
        await Promise.all([
          queries.listTeams().execute(),
          queries.listCompetitions().execute(),
          queries.listTeamCompetitions().execute(),
          queries.listRosterClubNames().execute(),
        ]);
      const index = buildClubIndex(
        teams,
        competitions,
        teamCompetitions,
        clubNames.map(({ football_club: club }) => club),
      );

      cached = { index, loadedAt: now() };

      return index;
    } finally {
      inFlight = undefined;
    }
  };

  return {
    load: async () => {
      if (cached !== undefined && now() - cached.loadedAt < CATALOG_TTL_MS) {
        return cached.index;
      }
      // Concurrent first requests share one load instead of each issuing the
      // same four catalog queries.
      inFlight ??= loadAndCache();

      return await inFlight;
    },
  };
};

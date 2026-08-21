import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createListLeaguesQueries } from "../queries.ts";

const queries = createListLeaguesQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

const PAGE = { limit: 25, offset: 50 };

const projectionOf = (sql: string): string =>
  sql.slice(sql.lastIndexOf(") SELECT "));

describe("listLeagues", () => {
  it("reads the catalog with FINAL and joins the athlete aggregate by external id", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain("FROM new_vertical.leagues FINAL");
    expect(sql).toContain(
      "LEFT ANY JOIN league_athletes ON new_vertical.leagues.external_id = league_athletes.league_key",
    );
  });

  it("reads only the sports vertical through a qualified column", () => {
    expect(queries.listLeagues(PAGE).toSQL()).toContain(
      "equals(new_vertical.leagues.vertical, 'sports')",
    );
    expect(queries.countLeagues(PAGE).toSQL()).toContain(
      "equals(new_vertical.leagues.vertical, 'sports')",
    );
  });

  it("aggregates only active, undeleted athletes read with FINAL", () => {
    const cte = /league_athletes AS \((.*?)\) SELECT /s.exec(
      queries.listLeagues(PAGE).toSQL(),
    )?.[1];

    expect(cte).toContain("FROM new_vertical.athletes_cache FINAL");
    expect(cte).toContain("is_active = 1");
    expect(cte).toContain("isNull(deleted_at)");
  });

  it("dedupes provider team names with argMax so the club join never reads a stale row", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "football_team_names AS (SELECT team_id, ifNull(argMax(name, _loaded_at), '') AS club_name FROM new_vertical.teams_apifootball GROUP BY team_id)",
    );
  });

  it("keeps one row per club name and competition, dropping nameless teams", () => {
    const cte = /football_club_leagues AS \((.*?)\), league_athletes AS /s.exec(
      queries.listLeagues(PAGE).toSQL(),
    )?.[1];

    expect(cte).toContain(
      "LEFT ANY JOIN football_team_names ON new_vertical.l_team_competition_apifootball.team_id = football_team_names.team_id",
    );
    expect(cte).toContain("notEquals(football_team_names.club_name, '')");
    expect(cte).toContain("GROUP BY club_name, competition_id");
  });

  it("fans each football athlete out to every competition their club plays in", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "LEFT JOIN football_club_leagues ON new_vertical.athletes_cache.football_club = football_club_leagues.club_name",
    );
    expect(sql).not.toContain(
      "LEFT ANY JOIN football_club_leagues ON new_vertical.athletes_cache.football_club",
    );
  });

  it("keys football on the competition id, label sports on the lowercased source label, and skips athletes with neither", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "if(football_club_leagues.competition_id != 0, toString(football_club_leagues.competition_id), lowerUTF8(coalesce(nullIf(basketball_league, ''), nullIf(tennis_tour, ''), ''))) AS league_key",
    );
    expect(sql).toContain("notEquals(league_key, '')");
    expect(sql).toContain("GROUP BY league_key");
  });

  it("takes the five highest-followed athletes per league, breaking ties by id", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "arraySlice(arraySort(entry -> (-entry.1, entry.2), groupArray((ifNull(ig_followers, 0), profile_id, name))), 1, 5)",
    );
  });

  it("projects the reach aggregate and keeps the threshold-only one out", () => {
    const projection = projectionOf(queries.listLeagues(PAGE).toSQL());

    expect(projection).toContain(
      "league_athletes.aggregated_ig_followers AS aggregated_ig_followers",
    );
    expect(projection).not.toContain("max_ig_followers");
  });

  it("matches a name case-insensitively as a substring", () => {
    const sql = queries.listLeagues({ ...PAGE, name: "Liga" }).toSQL();

    expect(sql).toContain(
      "notEquals(positionCaseInsensitiveUTF8(new_vertical.leagues.name, 'Liga'), 0)",
    );
  });

  it("lowercases both sides of the sport filter", () => {
    const sql = queries.listLeagues({ ...PAGE, sports: ["Football"] }).toSQL();

    expect(sql).toContain(
      "has(['football'], lowerUTF8(new_vertical.leagues.sport))",
    );
  });

  it.each([
    [
      "minTrackedAthletes",
      { minTrackedAthletes: 5 },
      "greaterOrEquals(ifNull(league_athletes.tracked_athletes, 0), 5)",
    ],
    [
      "minAggregatedIgFollowers",
      { minAggregatedIgFollowers: 1_000_000 },
      "greaterOrEquals(ifNull(league_athletes.aggregated_ig_followers, 0), 1000000)",
    ],
    [
      "megaOnly",
      { megaOnly: true },
      "greaterOrEquals(ifNull(league_athletes.max_ig_followers, 0), 100000000)",
    ],
  ])("reads an untracked league as zero for %s", (_name, filter, predicate) => {
    expect(queries.listLeagues({ ...PAGE, ...filter }).toSQL()).toContain(
      predicate,
    );
  });

  it("omits the mega threshold when the toggle is off", () => {
    const sql = queries.listLeagues({ ...PAGE, megaOnly: false }).toSQL();

    expect(sql).not.toContain("max_ig_followers, 0), 100000000");
  });

  it.each([
    ["the default", {}, "new_vertical.leagues.name ASC"],
    ["sport", { sortBy: "sport" }, "new_vertical.leagues.sport ASC"],
    [
      "tracked athletes, deepest first",
      { sortBy: "trackedAthletes" },
      "tracked_athletes DESC",
    ],
    [
      "reach, widest first",
      { sortBy: "igReach" },
      "ifNull(league_athletes.aggregated_ig_followers, 0) DESC",
    ],
  ] as const)("sorts by %s", (_name, sort, expected) => {
    const sql = queries.listLeagues({ ...PAGE, ...sort }).toSQL();

    expect(sql).toContain(`ORDER BY ${expected}, new_vertical.leagues.id ASC`);
  });

  it.each([
    ["name", { sortBy: "name" }, "asc", "new_vertical.leagues.name DESC"],
    [
      "igReach",
      { sortBy: "igReach" },
      "desc",
      "ifNull(league_athletes.aggregated_ig_followers, 0) ASC",
    ],
  ] as const)(
    "reverses the %s default when the caller asks for the other direction",
    (_name, sort, defaultDirection, expected) => {
      const requested = defaultDirection === "asc" ? "desc" : "asc";
      const sql = queries
        .listLeagues({ ...PAGE, ...sort, sortDirection: requested })
        .toSQL();

      expect(sql).toContain(
        `ORDER BY ${expected}, new_vertical.leagues.id ASC`,
      );
    },
  );

  it("keeps the id tiebreak ascending whichever direction is requested", () => {
    const sql = queries
      .listLeagues({ ...PAGE, sortBy: "trackedAthletes", sortDirection: "asc" })
      .toSQL();

    expect(sql).toContain(
      "ORDER BY tracked_athletes ASC, new_vertical.leagues.id ASC",
    );
  });

  // A league nobody tracks has no aggregate row, and `sum` over a Nullable
  // column is Nullable even where one exists. Sorting the raw column would park
  // those leagues at one end in both directions rather than at the zero the
  // reply reports for them.
  it("sorts reach on the same coalesced value the reply reports", () => {
    const ascending = queries
      .listLeagues({ ...PAGE, sortBy: "igReach", sortDirection: "asc" })
      .toSQL();

    expect(ascending).not.toMatch(
      /ORDER BY league_athletes\.aggregated_ig_followers/,
    );
    expect(ascending).not.toMatch(/ORDER BY aggregated_ig_followers/);
    expect(ascending).toContain(
      "ORDER BY ifNull(league_athletes.aggregated_ig_followers, 0) ASC",
    );
  });

  it("pages with the requested window", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain("LIMIT 25");
    expect(sql).toContain("OFFSET 50");
  });
});

describe("countLeagues", () => {
  it("counts through the same join and filters as the list", () => {
    const filter = { ...PAGE, megaOnly: true, name: "Liga" };
    const sql = queries.countLeagues(filter).toSQL();

    expect(sql).toContain("count() AS total");
    expect(sql).toContain(
      "LEFT ANY JOIN league_athletes ON new_vertical.leagues.external_id = league_athletes.league_key",
    );
    expect(sql).toContain(
      "notEquals(positionCaseInsensitiveUTF8(new_vertical.leagues.name, 'Liga'), 0)",
    );
    expect(sql).toContain(
      "greaterOrEquals(ifNull(league_athletes.max_ig_followers, 0), 100000000)",
    );
  });

  it("qualifies every filtered column so the aliasless count cannot go ambiguous", () => {
    const sql = queries
      .countLeagues({ ...PAGE, name: "Liga", sports: ["football"] })
      .toSQL();
    const where = sql.slice(sql.indexOf("WHERE"));

    expect(where).toContain("new_vertical.leagues.name");
    expect(where).toContain("new_vertical.leagues.sport");
    expect(where).toContain("new_vertical.leagues.vertical");
  });

  it("neither orders nor pages", () => {
    const sql = queries.countLeagues(PAGE).toSQL();

    expect(sql).not.toContain("ORDER BY");
    expect(sql).not.toContain("LIMIT");
  });
});

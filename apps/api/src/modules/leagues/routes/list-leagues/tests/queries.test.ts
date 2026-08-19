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
  it("reads the catalog with FINAL and joins the athlete aggregate by name", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain("FROM new_vertical.leagues FINAL");
    expect(sql).toContain(
      "LEFT ANY JOIN league_athletes ON new_vertical.leagues.name = league_athletes.league_label",
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

  it("derives the league label from the three source columns and skips unlabelled athletes", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "coalesce(nullIf(football_league, ''), nullIf(basketball_league, ''), concat(nullIf(tennis_tour, ''), ' Tour'), '') AS league_label",
    );
    expect(sql).toContain("notEquals(league_label, '')");
    expect(sql).toContain("GROUP BY league_label");
  });

  it("takes the five highest-followed athletes per league, breaking ties by id", () => {
    const sql = queries.listLeagues(PAGE).toSQL();

    expect(sql).toContain(
      "arraySlice(arraySort(entry -> (-entry.1, entry.2), groupArray((ifNull(ig_followers, 0), profile_id, name))), 1, 5)",
    );
  });

  it("keeps the follower aggregates out of the reply projection", () => {
    const projection = projectionOf(queries.listLeagues(PAGE).toSQL());

    expect(projection).not.toContain("aggregated_ig_followers");
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
  ] as const)("sorts by %s", (_name, sort, expected) => {
    const sql = queries.listLeagues({ ...PAGE, ...sort }).toSQL();

    expect(sql).toContain(`ORDER BY ${expected}, new_vertical.leagues.id ASC`);
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
      "LEFT ANY JOIN league_athletes ON new_vertical.leagues.name = league_athletes.league_label",
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

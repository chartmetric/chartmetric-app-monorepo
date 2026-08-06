import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createListAthletesQueries } from "../queries.ts";

const queries = createListAthletesQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

const PAGE = { limit: 25, offset: 50 };

describe("listAthletes", () => {
  it("reads the roster with FINAL and excludes inactive or deleted rows", () => {
    const sql = queries.listAthletes(PAGE).toSQL();

    expect(sql).toContain("FROM new_vertical.athletes_cache FINAL");
    expect(sql).toContain("equals(new_vertical.athletes_cache.is_active, 1)");
    expect(sql).toContain("isNull(new_vertical.athletes_cache.deleted_at)");
  });

  it("computes rank over the unfiltered roster so filters do not renumber it", () => {
    const sql = queries.listAthletes({ ...PAGE, verified: true }).toSQL();
    const rankCte = /WITH\s+roster_rank AS \((.*?)\)\s*,/s.exec(sql)?.[1] ?? "";

    expect(rankCte).toContain("row_number() OVER (ORDER BY ig_followers DESC");
    expect(rankCte).toContain("is_active = 1");
    expect(rankCte).not.toContain("ig_verified");
  });

  it("joins every enrichment source without fanning out rows", () => {
    const sql = queries.listAthletes(PAGE).toSQL();

    for (const source of [
      "roster_rank",
      "tiktok_latest",
      "last_match",
      "on3_school",
      "espn_basketball",
      "basketball_roster",
      "gps_scores",
      "momentum_scores",
    ]) {
      expect(sql).toContain(`LEFT ANY JOIN ${source} ON`);
    }
  });

  /**
   * Every enrichment source is a `ReplacingMergeTree`, and a joined table cannot
   * carry `FINAL`, so each is read through a CTE that does. Without this the join
   * can pick a row that is still awaiting a merge.
   */
  it("reads every enrichment source with FINAL", () => {
    const sql = queries.listAthletes(PAGE).toSQL();
    const ctes = sql.slice(0, sql.lastIndexOf(") SELECT "));

    for (const table of [
      "new_vertical.profile_snapshots",
      "new_vertical.athletes_basketball",
      "new_vertical.athletes_football_gps_scores_football_cache",
      "new_vertical.athletes_football_momentum_football_cache",
      "new_vertical.athletes_football_fixture_player_stats_apifootball",
    ]) {
      expect(ctes).toContain(`FROM ${table} FINAL`);
    }
  });

  /**
   * `athletes_basketball` is sorted by `id`, not `profile_id`, so `FINAL` cannot
   * reduce it to one row per athlete and the join key would otherwise match an
   * arbitrary row.
   */
  it("reduces the basketball roster to the newest row per athlete", () => {
    const sql = queries.listAthletes(PAGE).toSQL();

    expect(sql).toContain("argMax(team, updated_at) AS basketball_team");
    expect(sql).toMatch(
      /basketball_roster AS \(SELECT profile_id,.*GROUP BY profile_id\)/,
    );
  });

  it("keeps absent enrichment rows null instead of zero", () => {
    expect(queries.listAthletes(PAGE).getQueryNode().settings).toMatchObject({
      join_use_nulls: 1,
    });
  });

  it("paginates and applies a stable tiebreaker", () => {
    const sql = queries.listAthletes(PAGE).toSQL();

    expect(sql).toContain("ORDER BY athlete_rank ASC");
    expect(sql).toContain("new_vertical.athletes_cache.profile_id ASC");
    expect(sql).toContain("LIMIT 25");
    expect(sql).toContain("OFFSET 50");
  });

  /**
   * The cache column is backfilled on a delay, so the displayed count falls back
   * to snapshot history. Computing it once means the column a reader sees and
   * the column the sort uses are the same expression.
   */
  it("selects one TikTok follower count and sorts on it", () => {
    const sql = queries
      .listAthletes({
        ...PAGE,
        sortBy: "tiktokFollowers",
        sortDirection: "desc",
      })
      .toSQL();

    expect(sql).toContain(
      "nullIf(ifNull(nullIf(new_vertical.athletes_cache.tiktok_followers, 0), tiktok_latest.tiktok_snapshot_followers), 0) AS tiktok_followers",
    );
    expect(sql).toContain("ORDER BY tiktok_followers DESC");
  });

  /**
   * A `LEFT ANY JOIN` cannot change how many roster rows match, so the count
   * only needs the sources its filters read.
   */
  it("counts without joining enrichment no filter reads", () => {
    const sql = queries.countAthletes(PAGE).toSQL();

    for (const source of [
      "roster_rank",
      "tiktok_latest",
      "last_match",
      "espn_basketball",
      "basketball_roster",
      "gps_scores",
      "momentum_scores",
    ]) {
      expect(sql).not.toContain(source);
    }
    expect(sql).toContain("count() AS total");
  });

  it("counts with the sources a club filter reads", () => {
    const sql = queries.countAthletes({ ...PAGE, clubs: ["Roma"] }).toSQL();

    expect(sql).toContain("LEFT ANY JOIN on3_school ON");
    expect(sql).toContain("LEFT ANY JOIN basketball_roster ON");
    expect(sql).not.toContain("roster_rank");
    expect(sql).not.toContain("tiktok_latest");
  });

  it("counts with the basketball roster a league filter reads", () => {
    const sql = queries
      .countAthletes({ ...PAGE, leagues: ["NBA"] }, { leagueClubNames: [] })
      .toSQL();

    expect(sql).toContain("LEFT ANY JOIN basketball_roster ON");
    expect(sql).not.toContain("on3_school");
  });

  /**
   * Asking for a metric without a direction should show the best values, not the
   * worst; rank and the text columns read the other way.
   */
  it("defaults a metric sort to descending and a name sort to ascending", () => {
    expect(
      queries.listAthletes({ ...PAGE, sortBy: "cmScore" }).toSQL(),
    ).toContain("ORDER BY new_vertical.athletes_cache.cm_score DESC");
    expect(
      queries.listAthletes({ ...PAGE, sortBy: "igFollowers" }).toSQL(),
    ).toContain("ORDER BY new_vertical.athletes_cache.ig_followers DESC");
    expect(queries.listAthletes({ ...PAGE, sortBy: "name" }).toSQL()).toContain(
      "ORDER BY new_vertical.athletes_cache.name ASC",
    );
    expect(queries.listAthletes(PAGE).toSQL()).toContain(
      "ORDER BY athlete_rank ASC",
    );
  });

  it("keeps an explicit direction over the column's default", () => {
    expect(
      queries
        .listAthletes({ ...PAGE, sortBy: "cmScore", sortDirection: "asc" })
        .toSQL(),
    ).toContain("ORDER BY new_vertical.athletes_cache.cm_score ASC");
  });

  it("sorts by the snapshot column for TikTok likes", () => {
    expect(
      queries
        .listAthletes({ ...PAGE, sortBy: "tiktokLikes", sortDirection: "desc" })
        .toSQL(),
    ).toContain("ORDER BY snapshot_tiktok_likes DESC");
  });

  it("matches sports case-insensitively across ingestion sources", () => {
    const { parameters, sql } = queries
      .listAthletes({ ...PAGE, sports: ["Football", "Tennis"] })
      .toSQLWithParams();

    expect(sql).toContain(
      "has([?, ?], lowerUTF8(new_vertical.athletes_cache.sport))",
    );
    expect(parameters).toContain("football");
    expect(parameters).toContain("tennis");
  });

  it("excludes sports case-insensitively", () => {
    const { sql } = queries
      .listAthletes({ ...PAGE, excludeSports: ["Football"] })
      .toSQLWithParams();

    expect(sql).toContain(
      "not(has([?], lowerUTF8(new_vertical.athletes_cache.sport)))",
    );
  });

  it("treats a missing follower count as zero in range filters", () => {
    const { sql } = queries
      .listAthletes({ ...PAGE, maxFollowers: 1_000_000, minFollowers: 1000 })
      .toSQLWithParams();

    expect(sql).toContain(
      "greaterOrEquals(ifNull(new_vertical.athletes_cache.ig_followers, ?), ?)",
    );
    expect(sql).toContain(
      "lessOrEquals(ifNull(new_vertical.athletes_cache.ig_followers, ?), ?)",
    );
  });

  it("selects a single level by college sport membership", () => {
    const college = queries
      .listAthletes({ ...PAGE, levels: ["college"] })
      .toSQLWithParams().sql;
    const professional = queries
      .listAthletes({ ...PAGE, levels: ["professional"] })
      .toSQLWithParams().sql;

    expect(college).toContain(
      "has([?, ?, ?, ?, ?], new_vertical.athletes_cache.sport)",
    );
    expect(professional).toContain(
      "not(has([?, ?, ?, ?, ?], new_vertical.athletes_cache.sport))",
    );
  });

  it("does not constrain level when both levels are requested", () => {
    const { sql } = queries
      .listAthletes({ ...PAGE, levels: ["college", "professional"] })
      .toSQLWithParams();

    expect(sql).not.toContain(
      "has([?, ?, ?, ?, ?], new_vertical.athletes_cache.sport)",
    );
  });

  it("resolves a league filter across football clubs, basketball, and tennis", () => {
    const { parameters, sql } = queries
      .listAthletes(
        { ...PAGE, leagues: ["Serie A"] },
        { leagueClubNames: ["Roma", "Inter Milan"] },
      )
      .toSQLWithParams();

    expect(sql).toContain(
      "has([?, ?], new_vertical.athletes_cache.football_club)",
    );
    expect(sql).toContain("has([?], basketball_roster.basketball_league)");
    expect(sql).toContain("has([?], new_vertical.athletes_cache.tennis_tour)");
    expect(parameters).toContain("Roma");
    expect(parameters).toContain("Inter Milan");
    expect(parameters).toContain("Serie A");
  });

  it("adds the college branch only when NCAA is requested", () => {
    const withNcaa = queries
      .listAthletes({ ...PAGE, leagues: ["NCAA"] }, { leagueClubNames: [] })
      .toSQLWithParams().sql;
    const withoutNcaa = queries
      .listAthletes({ ...PAGE, leagues: ["Serie A"] }, { leagueClubNames: [] })
      .toSQLWithParams().sql;

    expect(withNcaa).toContain(
      "has([?, ?, ?, ?, ?], new_vertical.athletes_cache.sport)",
    );
    expect(withoutNcaa).not.toContain(
      "has([?, ?, ?, ?, ?], new_vertical.athletes_cache.sport)",
    );
  });

  it("matches a club filter against all three club sources", () => {
    const { sql } = queries
      .listAthletes({ ...PAGE, clubs: ["Roma"] })
      .toSQLWithParams();

    expect(sql).toContain(
      "has([?], new_vertical.athletes_cache.football_club)",
    );
    expect(sql).toContain("has([?], basketball_roster.basketball_team)");
    expect(sql).toContain("has([?], on3_school.school)");
  });

  it("applies the retained categorical and score filters", () => {
    const { sql } = queries
      .listAthletes({
        ...PAGE,
        excludeNationalities: ["Canada"],
        maxCmScore: 90,
        minCmScore: 10,
        name: "alex",
        nationalities: ["United States"],
        verified: true,
      })
      .toSQLWithParams();

    expect(sql).toContain(
      "positionCaseInsensitiveUTF8(new_vertical.athletes_cache.name, ?)",
    );
    expect(sql).toContain("new_vertical.athletes_cache.nationality IN (?)");
    expect(sql).toContain("new_vertical.athletes_cache.nationality NOT IN (?)");
    expect(sql).toContain(
      "greaterOrEquals(new_vertical.athletes_cache.cm_score, ?)",
    );
    expect(sql).toContain(
      "lessOrEquals(new_vertical.athletes_cache.cm_score, ?)",
    );
    expect(sql).toContain("equals(new_vertical.athletes_cache.ig_verified, ?)");
  });
});

describe("countAthletes", () => {
  /**
   * An unqualified column in the outer query is ambiguous as soon as an
   * enrichment source shares the name — `name` and `nationality` both exist on
   * the momentum cache — and ClickHouse rejects the whole query with
   * AMBIGUOUS_IDENTIFIER instead of choosing a side. The list query happens to
   * survive because its `... AS nationality` select alias shadows the column, so
   * the count query is where the mistake actually surfaces.
   */
  it("qualifies roster filters that share a name with an enrichment source", () => {
    const { sql } = queries
      .countAthletes({ ...PAGE, name: "alex", nationalities: ["Brazil"] })
      .toSQLWithParams();

    expect(sql).toContain(
      "positionCaseInsensitiveUTF8(new_vertical.athletes_cache.name, ?)",
    );
    expect(sql).toContain("new_vertical.athletes_cache.nationality IN (?)");
    expect(sql).not.toMatch(/[^.]nationality IN/);
    expect(sql).not.toMatch(/positionCaseInsensitiveUTF8\(name/);
  });

  it("counts the filtered set without pagination", () => {
    const sql = queries.countAthletes({ ...PAGE, verified: true }).toSQL();

    expect(sql).toContain("count() AS total");
    expect(sql).toContain("equals(new_vertical.athletes_cache.ig_verified, 1)");
    expect(sql).not.toContain("LIMIT 25");
    expect(sql).not.toContain("OFFSET 50");
  });
});

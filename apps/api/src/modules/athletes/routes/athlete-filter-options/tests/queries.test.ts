import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createAthleteFilterOptionsQueries } from "../queries.ts";

const queries = createAthleteFilterOptionsQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listAthleteFilterOptions", () => {
  it("selects bounded source rows for filter options", () => {
    const query = queries.listAthleteFilterOptions();
    const sql = query.toSQL();

    expect(sql).toContain("FROM new_vertical.athletes_cache FINAL");
    expect(sql).toContain("is_active = 1");
    expect(sql).toContain("isNull(deleted_at)");
    expect(sql).toContain("LIMIT 100000");
    expect(query.getQueryNode().settings).toMatchObject({
      max_execution_time: 30,
      max_rows_to_read: 10_000_000,
    });
  });

  it("reads the columns the filter options are grouped by", () => {
    const sql = queries.listAthleteFilterOptions().toSQL();

    for (const column of [
      "sport",
      "nationality",
      "cm_score",
      "football_club",
      "tennis_tour",
      "basketball_roster.basketball_team AS basketball_team",
      "basketball_roster.basketball_league AS basketball_league",
    ]) {
      expect(sql).toContain(column);
    }
  });

  it("joins the basketball roster without fanning out rows", () => {
    const sql = queries.listAthleteFilterOptions().toSQL();

    expect(sql).toContain("LEFT ANY JOIN basketball_roster ON");
    expect(
      queries.listAthleteFilterOptions().getQueryNode().settings,
    ).toMatchObject({ join_use_nulls: 1 });
  });
});

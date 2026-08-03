import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../db/clickhouse/schema.ts";

import { createAthleteQueries } from "../queries.ts";

const queries = createAthleteQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listAthletes", () => {
  it("selects, filters, and paginates the approved athlete fields", () => {
    const sql = queries.listAthletes({ limit: 25, offset: 50 }).toSQL();

    expect(sql).toContain("FROM new_vertical.athletes_cache FINAL");
    expect(sql).toMatch(
      /SELECT\s+profile_id,\s*name,\s*image_url,\s*sport,\s*nationality,\s*type,\s*cm_score\s+FROM/i,
    );
    expect(sql).toContain("is_active = 1");
    expect(sql).toContain("isNull(deleted_at)");
    expect(sql).toContain("ORDER BY cm_score DESC, profile_id ASC");
    expect(sql).toContain("LIMIT 25");
    expect(sql).toContain("OFFSET 50");
  });

  it("applies every supported filter and requested sort", () => {
    const { parameters, sql } = queries
      .listAthletes({
        excludeNationalities: ["Canada", "Mexico"],
        excludeTypes: ["team"],
        limit: 25,
        maxCmScore: 90,
        minCmScore: 10,
        name: "alex",
        nationalities: ["United States"],
        offset: 0,
        sortBy: "name",
        sortDirection: "asc",
        sports: ["Football", "Tennis"],
        types: ["athlete"],
      })
      .toSQLWithParams();

    expect(sql).toContain("positionCaseInsensitiveUTF8(name, ?)");
    expect(sql).toContain("sport IN (?, ?)");
    expect(sql).toContain("nationality IN (?)");
    expect(sql).toContain("type IN (?)");
    expect(sql).toContain("nationality NOT IN (?, ?)");
    expect(sql).toContain("type NOT IN (?)");
    expect(sql).toContain("cm_score >= ?");
    expect(sql).toContain("cm_score <= ?");
    expect(sql).toContain("ORDER BY name ASC, profile_id ASC");
    expect(parameters).toEqual([
      1,
      "alex",
      0,
      "Football",
      "Tennis",
      "United States",
      "athlete",
      "Canada",
      "Mexico",
      "team",
      10,
      90,
    ]);
  });

  it("selects bounded source rows for filter options", () => {
    const query = queries.listAthleteFilterOptions();
    const sql = query.toSQL();

    expect(sql).toContain("FROM new_vertical.athletes_cache FINAL");
    expect(sql).toMatch(
      /SELECT\s+sport,\s*nationality,\s*type,\s*cm_score\s+FROM/i,
    );
    expect(sql).toContain("is_active = 1");
    expect(sql).toContain("isNull(deleted_at)");
    expect(sql).toContain("LIMIT 100000");
    expect(query.getQueryNode().settings).toMatchObject({
      max_execution_time: 30,
      max_rows_to_read: 1_000_000,
    });
  });
});

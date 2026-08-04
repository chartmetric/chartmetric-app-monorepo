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

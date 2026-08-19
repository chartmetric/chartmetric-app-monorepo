import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createLeagueFilterOptionsQueries } from "../queries.ts";

const queries = createLeagueFilterOptionsQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listLeagueFilterOptions", () => {
  it("reads the distinct catalog sports with FINAL", () => {
    const sql = queries.listLeagueFilterOptions().toSQL();

    expect(sql).toContain("FROM new_vertical.leagues FINAL");
    expect(sql).toContain("GROUP BY sport");
  });

  it("reads only the sports vertical", () => {
    expect(queries.listLeagueFilterOptions().toSQL()).toContain(
      "WHERE vertical = 'sports'",
    );
  });
});

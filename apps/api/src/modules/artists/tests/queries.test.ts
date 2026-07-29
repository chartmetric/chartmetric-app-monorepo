import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../db/clickhouse/schema.ts";

import { createArtistQueries } from "../queries.ts";

// toSQL() is pure — no connection is opened.
const queries = createArtistQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listArtists", () => {
  it("composes a fully-qualified, paginated, ordered query", () => {
    const sql = queries.listArtists({ limit: 5, offset: 10 }).toSQL();

    expect(sql).toContain("FROM new_vertical.cm_artist FINAL");
    expect(sql).toContain("is_duplicate = 0");
    expect(sql).toContain("is_non_artist = 0");
    expect(sql).toContain("ORDER BY id ASC");
    expect(sql).toContain("LIMIT 5");
    expect(sql).toContain("OFFSET 10");
  });

  it("selects only the columns the API exposes", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toMatch(
      /SELECT\s+id,\s*name,\s*image_url,\s*code2,\s*record_label\s+FROM/i,
    );
  });
});

describe("profilesBySourceIds", () => {
  it("filters live profiles by the given source ids", () => {
    const sql = queries.profilesBySourceIds([7, 42]).toSQL();

    expect(sql).toContain("FROM new_vertical.profiles FINAL");
    expect(sql).toMatch(
      /SELECT\s+id,\s*name,\s*image_url,\s*source_id\s+FROM/i,
    );
    expect(sql).toContain("isNull(deleted_at)");
    expect(sql).toContain("active = 'true'");
    expect(sql).toMatch(/source_id\s+IN\s*\('7',\s*'42'\)/i);
    expect(sql).toContain("ORDER BY id ASC");
  });
});

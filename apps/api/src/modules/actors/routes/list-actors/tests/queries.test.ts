import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createListActorsQueries } from "../queries.ts";

const database = createQueryBuilder<Database>({
  url: "https://example.invalid",
});

describe("createListActorsQueries", () => {
  it("builds acting-only deduplicated list and count siblings", () => {
    const queries = createListActorsQueries(database);
    const listQuery = queries.listActors({ limit: 25, offset: 50 });
    const list = listQuery.toSQL();
    const count = queries.countActors().toSQL();

    for (const sql of [list, count]) {
      expect(sql).toContain("test_tv_persons FINAL");
      expect(sql).toContain("test_tv_person_socials FINAL");
      expect(sql).toContain("test_tv_credits FINAL");
      expect(sql).toContain("test_tv_titles FINAL");
      expect(sql).toContain("credit_type = 'cast'");
      expect(sql).toContain(
        "uniqExact(tuple(title_id, title_kind, character)) AS role_count",
      );
      expect(sql).toContain("arraySlice(arraySort");
      expect(sql).toContain("titles.network");
    }
    expect(list).toContain("instagram.instagram_followers IS NULL ASC");
    expect(list).toContain("instagram.instagram_followers DESC");
    expect(list).toContain("LIMIT 25 OFFSET 50");
    expect(count).toContain("count() AS total");
    expect(listQuery.getQueryNode().settings).toMatchObject({
      join_algorithm: "auto",
    });
  });

  it("reverses requested sorting while keeping null followers last", () => {
    const sql = createListActorsQueries(database)
      .listActors({
        limit: 10,
        offset: 0,
        sortBy: "instagramFollowers",
        sortDirection: "asc",
      })
      .toSQL();

    expect(sql).toContain("instagram.instagram_followers IS NULL ASC");
    expect(sql).toContain("instagram.instagram_followers ASC");
  });
});

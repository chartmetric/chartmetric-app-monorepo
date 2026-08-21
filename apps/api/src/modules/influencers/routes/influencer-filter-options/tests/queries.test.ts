import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createInfluencerFilterOptionsQueries } from "../queries.ts";

const queries = createInfluencerFilterOptionsQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("influencer filter-options vocabularies", () => {
  it.each([
    ["countryVocabulary", "creators.creator_country"],
    ["genderVocabulary", "creators.creator_gender"],
    ["ageGroupVocabulary", "creators.creator_age_group"],
  ] as const)(
    "%s scopes to creators and counts through the FINAL join",
    (name, column) => {
      const sql = queries[name]().toSQL();

      expect(sql).toContain(
        "WITH creators AS (SELECT accurateCastOrNull(profiles, 'UInt32') AS profile_id",
      );
      expect(sql).toContain("FROM new_vertical.creator_profile_cache FINAL");
      expect(sql).toContain("FROM new_vertical.profile FINAL");
      expect(sql).toContain("INNER JOIN creators ON id = creators.profile_id");
      expect(sql).toContain("profile_type = 'creator'");
      expect(sql).toContain("deleted_at IS NULL");
      expect(sql).toContain(`${column} AS value`);
      expect(sql).toContain("COUNT(id) AS count");
      expect(sql).toContain(`GROUP BY value, ${column}`);
    },
  );

  it("restricts the age-group vocabulary to the six supported buckets", () => {
    const sql = queries.ageGroupVocabulary().toSQL();

    expect(sql).toContain(
      "creators.creator_age_group IN ('18-', '18-24', '25-34', '35-44', '45-64', '65+')",
    );
  });

  it("counts categories by array-joining the extracted tags", () => {
    const sql = queries.categoryVocabulary().toSQL();

    expect(sql).toContain(
      "JSONExtract(creator_tags, 'Array(String)') AS category_tags",
    );
    expect(sql).toContain("scoped AS (SELECT id AS profile_id");
    expect(sql).toContain("FROM scoped ARRAY JOIN category_tags");
    expect(sql).toContain("category_tags AS value");
    expect(sql).toContain("COUNT(DISTINCT profile_id) AS count");
    expect(sql).toContain("GROUP BY value, category_tags");
    expect(sql).toContain("ORDER BY count DESC");
  });
});

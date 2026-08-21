import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createListInfluencersQueries } from "../queries.ts";

const queries = createListInfluencersQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listInfluencers", () => {
  it("reads both sources through FINAL, joins on the cast key, and paginates", () => {
    const sql = queries.listInfluencers({ limit: 25, offset: 50 }).toSQL();

    expect(sql).toContain(
      "WITH creators AS (SELECT accurateCastOrNull(profiles, 'UInt32') AS profile_id",
    );
    expect(sql).toContain("FROM new_vertical.creator_profile_cache FINAL");
    expect(sql).toContain("FROM new_vertical.profile FINAL");
    expect(sql).toContain("INNER JOIN creators ON id = creators.profile_id");
    expect(sql).toContain("profile_type = 'creator'");
    expect(sql).toContain("active = 'true'");
    expect(sql).toContain("deleted_at IS NULL");
    expect(sql).toContain("ORDER BY name ASC, id ASC");
    expect(sql).toContain("LIMIT 25");
    expect(sql).toContain("OFFSET 50");
  });

  it("applies every filter in both include and exclude modes", () => {
    const { parameters, sql } = queries
      .listInfluencers({
        ageGroups: ["25-34"],
        categories: ["Music", "Gaming"],
        countries: ["US"],
        excludeAgeGroups: ["65+"],
        excludeCategories: ["Sports"],
        excludeCountries: ["CA"],
        excludeGenders: ["male"],
        genders: ["female"],
        handle: "ava",
        limit: 25,
        offset: 0,
        sortDirection: "desc",
      })
      .toSQLWithParams();

    expect(sql).toContain(
      "hasAny(JSONExtract(creators.creator_tags, ?), [?, ?])",
    );
    expect(sql).toContain(
      "not(hasAny(JSONExtract(creators.creator_tags, ?), [?]))",
    );
    expect(sql).toContain("creators.creator_country IN (?)");
    expect(sql).toContain("creators.creator_country NOT IN (?)");
    expect(sql).toContain("creators.creator_gender IN (?)");
    expect(sql).toContain("creators.creator_gender NOT IN (?)");
    expect(sql).toContain("creators.creator_age_group IN (?)");
    expect(sql).toContain("creators.creator_age_group NOT IN (?)");
    expect(sql).toContain(
      "positionCaseInsensitiveUTF8(creators.tiktok_handle, ?)",
    );
    expect(sql).toContain(
      "positionCaseInsensitiveUTF8(creators.instagram_handle, ?)",
    );
    expect(sql).toContain(
      "positionCaseInsensitiveUTF8(creators.youtube_handle, ?)",
    );
    expect(sql).toContain("ORDER BY name DESC, id ASC");
    expect(parameters).toEqual([
      "creator",
      "true",
      "Array(String)",
      "Music",
      "Gaming",
      "Array(String)",
      "Sports",
      "US",
      "CA",
      "female",
      "male",
      "25-34",
      "65+",
      "ava",
      0,
      "ava",
      0,
      "ava",
      0,
    ]);
  });

  it("counts the filtered set with the same source and filters", () => {
    const sql = queries
      .countInfluencers({ countries: ["US"], limit: 25, offset: 0 })
      .toSQL();

    expect(sql).toContain("COUNT(id) AS total");
    expect(sql).toContain("FROM new_vertical.profile FINAL");
    expect(sql).toContain("INNER JOIN creators ON id = creators.profile_id");
    expect(sql).toContain("profile_type = 'creator'");
    expect(sql).toContain("active = 'true'");
    expect(sql).toContain("creators.creator_country IN ('US')");
  });
});

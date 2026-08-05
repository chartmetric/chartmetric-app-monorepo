import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createArtistFilterOptionsQueries } from "../queries.ts";

// toSQL() is pure — no connection is opened.
const queries = createArtistFilterOptionsQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("countryOptions", () => {
  it("counts live artists per country", () => {
    const sql = queries.countryOptions().toSQL();

    expect(sql).toContain(
      "SELECT code2, COUNT(id) AS count FROM new_vertical.cm_artist FINAL",
    );
    expect(sql).toContain("is_duplicate = 0");
    expect(sql).toContain("is_non_artist = 0");
    expect(sql).toContain("notEquals(code2, '')");
    expect(sql).toContain("GROUP BY code2");
  });
});

describe("genreOptions", () => {
  it("counts distinct artists per genre slug", () => {
    const sql = queries.genreOptions().toSQL();

    expect(sql).toContain(
      "SELECT tag_slug, COUNT(DISTINCT cm_artist) AS count FROM new_vertical.l_cm_artist_tag",
    );
    expect(sql).toContain("tag_type = 'genre'");
    expect(sql).toContain("GROUP BY tag_slug");
  });
});

describe("followerBounds", () => {
  it("computes the maximum followers per platform", () => {
    expect(queries.instagramFollowerBounds().toSQL()).toContain(
      "SELECT MAX(followers) AS max_followers FROM new_vertical.instagram_cache",
    );
    expect(queries.tiktokFollowerBounds().toSQL()).toContain(
      "SELECT MAX(follower_count) AS max_followers FROM new_vertical.tiktok_cache",
    );
  });
});

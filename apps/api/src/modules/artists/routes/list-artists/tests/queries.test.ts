import { createQueryBuilder } from "@hypequery/clickhouse";
import { describe, expect, it } from "vitest";

import type { Database } from "../../../../../db/clickhouse/schema.ts";

import { createListArtistsQueries } from "../queries.ts";

// toSQL() is pure — no connection is opened.
const queries = createListArtistsQueries(
  createQueryBuilder<Database>({ url: "http://localhost:8123" }),
);

describe("listArtists", () => {
  it("composes a fully-qualified, paginated, ordered query", () => {
    const sql = queries.listArtists({ limit: 5, offset: 10 }).toSQL();

    expect(sql).toContain("FROM new_vertical.cm_artist FINAL");
    expect(sql).toContain("is_duplicate = 0");
    expect(sql).toContain("is_non_artist = 0");
    expect(sql).toContain("ORDER BY cm_score DESC, id ASC");
    expect(sql).toContain("LIMIT 5");
    expect(sql).toContain("OFFSET 10");
  });

  it("joins the metric CTEs built from the social and score tables", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toContain(
      "WITH latest_ig AS (SELECT account_id, argMax(followers, snapshot_date) AS instagram_followers FROM new_vertical.instagram_cache GROUP BY account_id)",
    );
    expect(sql).toContain(
      "latest_tt AS (SELECT account_id, argMax(follower_count, snapshot_date) AS tiktok_followers FROM new_vertical.tiktok_cache GROUP BY account_id)",
    );
    expect(sql).toContain("FROM new_vertical.l_profile_account FINAL");
    expect(sql).toContain("disconnected_at IS NULL");
    expect(sql).toContain(
      "latest_score AS (SELECT profile_id, argMax(cm_score, score_date) AS cm_score FROM new_vertical.cm_scores WHERE profile_type = 'musician' GROUP BY profile_id)",
    );
    expect(sql).toContain("FROM new_vertical.profile FINAL");
    expect(sql).toContain("accurateCastOrNull(cm_source_id, 'Int32')");
    expect(sql).toContain(
      "profile_verified AS (SELECT profile_id, max(verified = 'true') AS is_verified FROM new_vertical.profile_snapshots WHERE platform IN ('instagram', 'tiktok') GROUP BY profile_id)",
    );
    expect(sql).toContain(
      "LEFT ANY JOIN artist_metrics ON id = artist_metrics.artist_id",
    );
  });

  it("selects the base columns and joined metrics", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toMatch(
      /SELECT\s+id,\s*name,\s*image_url,\s*code2,\s*record_label,\s*artist_metrics\.profile_name/i,
    );
    expect(sql).toContain("artist_metrics.cm_score");
    expect(sql).toContain("artist_metrics.instagram_followers");
    expect(sql).toContain("artist_metrics.tiktok_followers");
    expect(sql).toContain("artist_metrics.is_verified");
  });

  it.each([
    ["name", "name"],
    ["countryCode", "code2"],
    ["instagramFollowers", "instagram_followers"],
    ["tiktokFollowers", "tiktok_followers"],
  ] as const)("sorts by %s via the %s column", (sortBy, column) => {
    const sql = queries
      .listArtists({ limit: 1, offset: 0, sortBy, sortDirection: "asc" })
      .toSQL();

    expect(sql).toContain(`ORDER BY ${column} ASC, id ASC`);
  });
});

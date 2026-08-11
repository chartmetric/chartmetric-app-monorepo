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
      "WITH latest_ig AS (SELECT account_id, max(snapshot_date <= today() - 7) AS instagram_has_past, argMax(if(snapshot_date <= today() - 7, followers, 0), if(snapshot_date <= today() - 7, snapshot_date, toDate(0))) AS instagram_followers_past, argMax(followers, snapshot_date) AS instagram_followers, MAX(is_verified) AS instagram_verified FROM new_vertical.instagram_cache GROUP BY account_id)",
    );
    expect(sql).toContain(
      "latest_tt AS (SELECT account_id, max(snapshot_date <= today() - 7) AS tiktok_has_past, argMax(if(snapshot_date <= today() - 7, follower_count, 0), if(snapshot_date <= today() - 7, snapshot_date, toDate(0))) AS tiktok_followers_past, argMax(follower_count, snapshot_date) AS tiktok_followers, MAX(is_verified) AS tiktok_verified FROM new_vertical.tiktok_cache GROUP BY account_id)",
    );
    expect(sql).toContain("FROM new_vertical.l_profile_account FINAL");
    expect(sql).toContain("disconnected_at IS NULL");
    expect(sql).toContain(
      "latest_score AS (SELECT profile_id, max(score_date <= today() - 7) AS cm_has_past, argMax(if(score_date <= today() - 7, cm_scores.cm_score, 0), if(score_date <= today() - 7, score_date, toDate(0))) AS cm_score_past, argMax(cm_score, score_date) AS cm_score FROM new_vertical.cm_scores WHERE profile_type = 'musician' GROUP BY profile_id)",
    );
    expect(sql).toContain("FROM new_vertical.profile FINAL");
    expect(sql).toContain(
      "profile_type = 'musician' AND vertical = 'music' AND active = 'true' AND deleted_at IS NULL",
    );
    expect(sql).toContain("accurateCastOrNull(cm_source_id, 'Int32')");
    expect(sql).toContain(
      "LEFT ANY JOIN artist_metrics ON id = artist_metrics.artist_id",
    );
  });

  it("derives verification from the account caches, not profile_snapshots", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toContain(
      "greatest(ifNull(profile_ig.instagram_verified, 0), ifNull(profile_tt.tiktok_verified, 0)) AS is_verified",
    );
    expect(sql).toContain(
      "MAX(latest_ig.instagram_verified) AS instagram_verified",
    );
    expect(sql).toContain("MAX(latest_tt.tiktok_verified) AS tiktok_verified");
    expect(sql).not.toContain("profile_snapshots");
  });

  it("selects the base columns and joined metrics", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toMatch(
      /SELECT\s+id,\s*name,\s*image_url,\s*code2,\s*record_label,\s*artist_metrics\.profile_name/i,
    );
    expect(sql).toContain("artist_metrics.cm_score");
    expect(sql).toContain("artist_metrics.cm_score_change");
    expect(sql).toContain("artist_metrics.cm_score_change_percent");
    expect(sql).toContain("artist_metrics.instagram_followers");
    expect(sql).toContain("artist_metrics.instagram_followers_change");
    expect(sql).toContain("artist_metrics.tiktok_followers");
    expect(sql).toContain("artist_metrics.tiktok_followers_change_percent");
    expect(sql).toContain("artist_metrics.is_verified");
  });

  it("computes change and percent-change columns in artist_metrics", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toContain(
      "if(profile_ig.instagram_has_past = 1, profile_ig.instagram_followers - profile_ig.instagram_followers_past, NULL) AS instagram_followers_change",
    );
    expect(sql).toContain(
      "if(profile_ig.instagram_has_past = 1 AND profile_ig.instagram_followers_past > 0, (profile_ig.instagram_followers - profile_ig.instagram_followers_past) / profile_ig.instagram_followers_past * 100, NULL) AS instagram_followers_change_percent",
    );
    expect(sql).toContain(
      "if(latest_score.cm_has_past = 1, latest_score.cm_score - latest_score.cm_score_past, NULL) AS cm_score_change",
    );
  });

  it.each([
    ["1d", 1],
    ["7d", 7],
    ["28d", 28],
  ] as const)("anchors the past snapshot to %s", (changePeriod, days) => {
    const sql = queries
      .listArtists({ changePeriod, limit: 1, offset: 0 })
      .toSQL();

    expect(sql).toContain(`snapshot_date <= today() - ${String(days)}`);
    expect(sql).toContain(`score_date <= today() - ${String(days)}`);
  });

  it("applies country, genre, and follower-range filters", () => {
    const sql = queries
      .listArtists({
        countries: ["US", "KR"],
        excludeCountries: ["GB"],
        excludeGenres: ["pop"],
        genres: ["k-pop", "rock"],
        limit: 5,
        maxInstagramFollowers: 1000,
        maxTiktokFollowers: 4000,
        minInstagramFollowers: 10,
        minTiktokFollowers: 20,
        offset: 0,
      })
      .toSQL();

    expect(sql).toContain(
      "genre_match AS (SELECT cm_artist FROM new_vertical.l_cm_artist_tag WHERE tag_type = 'genre' AND tag_slug IN ('k-pop', 'rock') GROUP BY cm_artist)",
    );
    expect(sql).toContain(
      "genre_exclude AS (SELECT cm_artist FROM new_vertical.l_cm_artist_tag WHERE tag_type = 'genre' AND tag_slug IN ('pop') GROUP BY cm_artist)",
    );
    expect(sql).toContain("code2 IN ('US', 'KR')");
    expect(sql).toContain("code2 NOT IN ('GB')");
    expect(sql).toContain("genre_match.cm_artist IS NOT NULL");
    expect(sql).toContain("genre_exclude.cm_artist IS NULL");
    expect(sql).toContain(
      "greaterOrEquals(artist_metrics.instagram_followers, 10)",
    );
    expect(sql).toContain(
      "lessOrEquals(artist_metrics.instagram_followers, 1000)",
    );
    expect(sql).toContain(
      "greaterOrEquals(artist_metrics.tiktok_followers, 20)",
    );
    expect(sql).toContain(
      "lessOrEquals(artist_metrics.tiktok_followers, 4000)",
    );
  });

  it("keeps only verified artists when verifiedOnly is set", () => {
    const sql = queries
      .listArtists({ limit: 1, offset: 0, verifiedOnly: true })
      .toSQL();

    expect(sql).toContain("equals(artist_metrics.is_verified, 1)");
  });

  it("skips the verified filter when verifiedOnly is absent", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).not.toContain("equals(artist_metrics.is_verified, 1)");
  });

  it("matches artist names case-insensitively", () => {
    const sql = queries
      .listArtists({ limit: 1, name: "selena", offset: 0 })
      .toSQL();

    expect(sql).toContain(
      "notEquals(positionCaseInsensitiveUTF8(name, 'selena'), 0)",
    );
  });

  it("pins unused genre CTEs to an empty tag type", () => {
    const sql = queries.listArtists({ limit: 1, offset: 0 }).toSQL();

    expect(sql).toContain(
      "genre_match AS (SELECT cm_artist FROM new_vertical.l_cm_artist_tag WHERE tag_type = 'none' GROUP BY cm_artist)",
    );
    expect(sql).not.toContain("genre_match.cm_artist IS NOT NULL");
    expect(sql).not.toContain("genre_exclude.cm_artist IS NULL");
  });

  it.each([
    ["name", "name"],
    ["countryCode", "code2"],
    ["instagramFollowers", "instagram_followers"],
    ["instagramFollowersChange", "instagram_followers_change"],
    ["instagramFollowersChangePercent", "instagram_followers_change_percent"],
    ["tiktokFollowers", "tiktok_followers"],
    ["tiktokFollowersChange", "tiktok_followers_change"],
    ["tiktokFollowersChangePercent", "tiktok_followers_change_percent"],
    ["cmScoreChange", "cm_score_change"],
    ["cmScoreChangePercent", "cm_score_change_percent"],
  ] as const)("sorts by %s via the %s column", (sortBy, column) => {
    const sql = queries
      .listArtists({ limit: 1, offset: 0, sortBy, sortDirection: "asc" })
      .toSQL();

    expect(sql).toContain(`ORDER BY ${column} ASC, id ASC`);
  });
});

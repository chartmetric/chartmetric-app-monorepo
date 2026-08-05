import { describe, expect, it } from "vitest";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.cm_artist": [
    {
      cm_score: 88.3,
      cm_score_change: 1.2,
      cm_score_change_percent: 1.377,
      code2: "US",
      id: 42,
      image_url: "https://img/artist-42.jpg",
      instagram_followers: 404_690_279,
      instagram_followers_change: 250_000,
      instagram_followers_change_percent: 0.0618,
      is_verified: 1,
      name: "Artist Name",
      profile_image_url: "https://img/profile-42.jpg",
      profile_name: "Profile Name",
      record_label: "Label A",
      tiktok_followers: "58708640",
      tiktok_followers_change: "-12345",
      tiktok_followers_change_percent: -0.021,
    },
    {
      cm_score: null,
      cm_score_change: null,
      cm_score_change_percent: null,
      code2: "",
      id: 43,
      image_url: "",
      instagram_followers: null,
      instagram_followers_change: null,
      instagram_followers_change_percent: null,
      is_verified: null,
      name: "No Profile",
      profile_image_url: null,
      profile_name: null,
      record_label: "",
      tiktok_followers: null,
      tiktok_followers_change: null,
      tiktok_followers_change_percent: null,
    },
  ],
};

describe("GET /artists", () => {
  it.each(["/app/artists", "/v1/artists"])(
    "returns the enriched list on %s",
    async (url) => {
      const app = await buildApp({
        clickhouse: stubClickhouse(rows),
        config: testConfig,
      });

      const response = await app.inject({ method: "GET", url });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: [
          {
            cmScore: 88.3,
            cmScoreChange: 1.2,
            cmScoreChangePercent: 1.377,
            countryCode: "US",
            id: 42,
            imageUrl: "https://img/profile-42.jpg",
            instagramFollowers: 404_690_279,
            instagramFollowersChange: 250_000,
            instagramFollowersChangePercent: 0.0618,
            isVerified: true,
            name: "Profile Name",
            recordLabel: "Label A",
            tiktokFollowers: 58_708_640,
            tiktokFollowersChange: -12_345,
            tiktokFollowersChangePercent: -0.021,
          },
          {
            cmScore: null,
            cmScoreChange: null,
            cmScoreChangePercent: null,
            countryCode: null,
            id: 43,
            imageUrl: null,
            instagramFollowers: null,
            instagramFollowersChange: null,
            instagramFollowersChangePercent: null,
            isVerified: false,
            name: "No Profile",
            recordLabel: null,
            tiktokFollowers: null,
            tiktokFollowersChange: null,
            tiktokFollowersChangePercent: null,
          },
        ],
        meta: { limit: 50, offset: 0 },
      });
      await app.close();
    },
  );

  it.each([
    ["a limit above the maximum", "/v1/artists?limit=9999"],
    ["an unknown change period", "/app/artists?changePeriod=90d"],
    ["an unknown sort column", "/app/artists?sortBy=followers"],
    [
      "an inverted follower range",
      "/app/artists?minInstagramFollowers=100&maxInstagramFollowers=1",
    ],
    ["a negative follower bound", "/app/artists?minTiktokFollowers=-5"],
  ])("rejects %s", async (_case, url) => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("echoes the requested pagination in meta", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/artists?limit=5&offset=10",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { limit: 5, offset: 10 },
    });
    await app.close();
  });
});

describe("GET /artists/filter-options", () => {
  const optionRows = {
    "new_vertical.cm_artist": [
      { code2: "US", count: "12" },
      { code2: "KR", count: "5" },
    ],
    "new_vertical.l_cm_artist_tag": [
      { count: "9", tag_slug: "pop" },
      { count: "3", tag_slug: "rock" },
    ],
    "new_vertical.instagram_cache": [{ max_followers: "404690279" }],
    "new_vertical.tiktok_cache": [{ max_followers: "129100000" }],
  };

  it("returns sorted options on the app surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(optionRows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/artists/filter-options",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      countries: [
        { count: 12, value: "US" },
        { count: 5, value: "KR" },
      ],
      genres: [
        { count: 9, value: "pop" },
        { count: 3, value: "rock" },
      ],
      instagramFollowers: { max: 404_690_279, min: 0 },
      tiktokFollowers: { max: 129_100_000, min: 0 },
    });
    await app.close();
  });

  it("is absent from the developer surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(optionRows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/artists/filter-options",
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});

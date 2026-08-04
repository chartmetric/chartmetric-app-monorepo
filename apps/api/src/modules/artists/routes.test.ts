import { describe, expect, it } from "vitest";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.cm_artist": [
    {
      cm_score: 88.3,
      code2: "US",
      id: 42,
      image_url: "https://img/artist-42.jpg",
      instagram_followers: 404_690_279,
      is_verified: 1,
      name: "Artist Name",
      profile_image_url: "https://img/profile-42.jpg",
      profile_name: "Profile Name",
      record_label: "Label A",
      tiktok_followers: "58708640",
    },
    {
      cm_score: null,
      code2: "",
      id: 43,
      image_url: "",
      instagram_followers: null,
      is_verified: null,
      name: "No Profile",
      profile_image_url: null,
      profile_name: null,
      record_label: "",
      tiktok_followers: null,
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
            countryCode: "US",
            id: 42,
            imageUrl: "https://img/profile-42.jpg",
            instagramFollowers: 404_690_279,
            isVerified: true,
            name: "Profile Name",
            recordLabel: "Label A",
            tiktokFollowers: 58_708_640,
          },
          {
            cmScore: null,
            countryCode: null,
            id: 43,
            imageUrl: null,
            instagramFollowers: null,
            isVerified: false,
            name: "No Profile",
            recordLabel: null,
            tiktokFollowers: null,
          },
        ],
        meta: { limit: 50, offset: 0 },
      });
      await app.close();
    },
  );

  it("rejects a limit above the maximum", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/artists?limit=9999",
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects an unknown sort column", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/artists?sortBy=followers",
    });

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

import { describe, expect, it } from "vitest";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.profile": [
    {
      creator_age_group: "25-34",
      creator_city: "Los Angeles",
      creator_country: "US",
      creator_gender: "female",
      creator_subtags: '["Pop"]',
      creator_tags: '["Music", "Gaming"]',
      id: 100,
      instagram_handle: "ava_ig",
      name: "Ava Creator",
      tiktok_handle: "ava_tt",
      total: 2,
      youtube_handle: "ava_yt",
    },
    {
      creator_age_group: "",
      creator_city: "",
      creator_country: "",
      creator_gender: "",
      creator_subtags: "",
      creator_tags: "",
      id: 101,
      instagram_handle: "",
      name: "",
      tiktok_handle: "",
      total: 2,
      youtube_handle: "",
    },
  ],
};

const expectedBody = {
  data: [
    {
      ageGroup: "25-34",
      categories: ["Music", "Gaming"],
      city: "Los Angeles",
      country: "US",
      gender: "female",
      id: 100,
      instagramHandle: "ava_ig",
      name: "Ava Creator",
      subtags: ["Pop"],
      tiktokHandle: "ava_tt",
      youtubeHandle: "ava_yt",
    },
    {
      ageGroup: null,
      categories: [],
      city: null,
      country: null,
      gender: null,
      id: 101,
      instagramHandle: null,
      name: null,
      subtags: [],
      tiktokHandle: null,
      youtubeHandle: null,
    },
  ],
  meta: { limit: 25, offset: 0, total: 2 },
};

describe("GET /influencers", () => {
  it("returns the influencer list on the app surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/influencers?limit=25&offset=0",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expectedBody);
    await app.close();
  });

  it("serves the same payload on the v1 developer surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const appResponse = await app.inject({
      method: "GET",
      url: "/app/influencers?limit=25&offset=0",
    });
    const v1Response = await app.inject({
      method: "GET",
      url: "/v1/influencers?limit=25&offset=0",
    });

    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json()).toEqual(appResponse.json());
    await app.close();
  });

  it("keeps filter options off the v1 developer surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/influencers/filter-options",
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns the four filter-option vocabularies on the app surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse({
        "new_vertical.profile": [
          { count: "20", value: "US" },
          { count: "5", value: "BR" },
          { count: "1", value: "" },
        ],
      }),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/influencers/filter-options",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ageGroups: [
        { count: 0, value: "18-" },
        { count: 0, value: "18-24" },
        { count: 0, value: "25-34" },
        { count: 0, value: "35-44" },
        { count: 0, value: "45-64" },
        { count: 0, value: "65+" },
      ],
      categories: [],
      countries: [
        { count: 20, value: "US" },
        { count: 5, value: "BR" },
      ],
      genders: [
        { count: 20, value: "US" },
        { count: 5, value: "BR" },
      ],
    });
    await app.close();
  });

  it("accepts repeated include and exclude filter parameters", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/influencers?categories=Music&categories=Gaming&excludeCountries=CA&genders=female&ageGroups=25-34&excludeAgeGroups=65%2B&handle=ava",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it.each([
    ["invalid pagination", "/app/influencers?limit=9999"],
    ["an unsupported sort column", "/app/influencers?sortBy=followers"],
    [
      "an overlapping data-quality age group",
      "/app/influencers?ageGroups=18-34",
    ],
  ])("rejects %s", async (_scenario, url) => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

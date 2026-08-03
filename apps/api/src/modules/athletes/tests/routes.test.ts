import { describe, expect, it } from "vitest";

import { buildApp } from "../../../app.ts";
import { stubClickhouse, testConfig } from "../../../tests/helpers.ts";

const rows = {
  "new_vertical.athletes_cache": [
    {
      cm_score: 87.4,
      image_url: "https://img/athlete-42.jpg",
      name: "Alex Morgan",
      nationality: "United States",
      profile_id: 42,
      sport: "Football",
      type: "athlete",
    },
  ],
};

describe("GET /athletes", () => {
  it("returns the athlete list on the app surface", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/athletes?limit=25&offset=0",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [
        {
          cmScore: 87.4,
          id: 42,
          imageUrl: "https://img/athlete-42.jpg",
          name: "Alex Morgan",
          nationality: "United States",
          sport: "Football",
          type: "athlete",
        },
      ],
      meta: { limit: 25, offset: 0 },
    });
    await app.close();
  });

  it("does not expose the endpoint on v1", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url: "/v1/athletes" });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it.each([
    ["invalid pagination", "/app/athletes?limit=9999"],
    ["an unsupported sort column", "/app/athletes?sortBy=followers"],
    ["an inverted CM score range", "/app/athletes?minCmScore=90&maxCmScore=10"],
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

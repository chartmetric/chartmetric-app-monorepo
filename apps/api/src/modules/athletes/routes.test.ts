import type { FastifyInstance } from "fastify";

import { describe, expect, it } from "vitest";

import type { ListAthletesReply } from "./routes/list-athletes/schemas.ts";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.athletes_cache": [
    {
      athlete_rank: 1,
      cm_score: 87.4,
      date_of_birth: "1989-07-02",
      football_club: "Orlando Pride",
      football_position: "FW",
      ig_followers: 10_000_000,
      ig_handle: "alexmorgan13",
      ig_posts: 1200,
      ig_verified: 1,
      image_url: "https://img/athlete-42.jpg",
      name: "Alex Morgan",
      nationality: "United States",
      profile_id: 42,
      sport: "football",
    },
    {
      athlete_rank: 2,
      cm_score: 72.1,
      image_url: null,
      name: "Christine Sinclair",
      nationality: "Canada",
      profile_id: 43,
      sport: "football",
    },
    {
      athlete_rank: 3,
      cm_score: null,
      image_url: null,
      name: "",
      nationality: null,
      profile_id: 44,
      sport: "tennis",
      tennis_ranking: 5,
      tennis_tour: "WTA",
    },
  ],
};

const buildTestApp = async (): Promise<FastifyInstance> =>
  await buildApp({ clickhouse: stubClickhouse(rows), config: testConfig });

describe("GET /athletes", () => {
  it("returns the enriched athlete list on the app surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/athletes?limit=25&offset=0",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<ListAthletesReply>();

    expect(body.meta).toEqual({ limit: 25, offset: 0, total: 3 });
    expect(body.data).toHaveLength(3);
    expect(body.data[0]).toMatchObject({
      age: 37,
      club: "Orlando Pride",
      cmScore: 87.4,
      id: 42,
      igFollowers: 10_000_000,
      igPosts: 1200,
      igVerified: true,
      imageUrl: "https://img/athlete-42.jpg",
      level: "professional",
      name: "Alex Morgan",
      nationality: "United States",
      position: "FW",
      rank: 1,
      sport: "Football",
    });
    expect(body.data[0]?.socialLinks).toEqual([
      {
        handle: "alexmorgan13",
        platform: "instagram",
        url: "https://www.instagram.com/alexmorgan13",
      },
    ]);
    await app.close();
  });

  it("derives tennis league and position from the tour and ranking", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/athletes?limit=25&offset=0",
    });

    expect(response.json<ListAthletesReply>().data[2]).toMatchObject({
      club: null,
      leagues: ["WTA"],
      name: null,
      position: "#5",
      sport: "Tennis",
    });
    await app.close();
  });

  it("serves the same payload on the v1 developer surface", async () => {
    const app = await buildTestApp();

    const appResponse = await app.inject({
      method: "GET",
      url: "/app/athletes?limit=25&offset=0",
    });
    const v1Response = await app.inject({
      method: "GET",
      url: "/v1/athletes?limit=25&offset=0",
    });

    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json()).toEqual(appResponse.json());
    await app.close();
  });

  it("keeps filter options off the v1 developer surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/v1/athletes/filter-options",
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns complete athlete filter options on the app surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/athletes/filter-options",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      clubsBySport: { Football: { Other: ["Orlando Pride"] } },
      cmScore: { max: 87.4, min: 72.1 },
      leaguesBySport: { Tennis: ["WTA"] },
      nationalities: [
        { count: 1, value: "Canada" },
        { count: 1, value: "United States" },
      ],
      sports: [
        { count: 2, value: "Football" },
        { count: 1, value: "Tennis" },
      ],
      sportsByLevel: { college: [], professional: ["Football", "Tennis"] },
    });
    await app.close();
  });

  it("accepts repeated include and exclude filter parameters", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/athletes?limit=25&offset=0&sports=Football&sports=Tennis&excludeNationalities=Canada&leagues=Serie%20A&clubs=Roma&levels=professional",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it.each([
    ["invalid pagination", "/app/athletes?limit=9999"],
    ["an unsupported sort column", "/app/athletes?sortBy=followers"],
    ["an unsupported level", "/app/athletes?levels=amateur"],
    ["an inverted CM score range", "/app/athletes?minCmScore=90&maxCmScore=10"],
    [
      "an inverted follower range",
      "/app/athletes?minFollowers=1000000&maxFollowers=1000",
    ],
  ])("rejects %s", async (_scenario, url) => {
    const app = await buildTestApp();

    const response = await app.inject({ method: "GET", url });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

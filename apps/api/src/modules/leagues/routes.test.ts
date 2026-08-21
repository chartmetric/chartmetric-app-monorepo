import type { FastifyInstance } from "fastify";

import { describe, expect, it } from "vitest";

import type { ListLeaguesReply } from "./routes/list-leagues/schemas.ts";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.leagues": [
    {
      aggregated_ig_followers: "184000000",
      country_flag_url: "https://media.api-sports.io/flags/es.svg",
      id: "2805663106422782827",
      key_athletes: [
        [686, "Kylian Mbappé"],
        [706, "Vinícius Júnior"],
      ],
      league_type: "club_league",
      logo_url: "https://media.api-sports.io/football/leagues/140.png",
      name: "La Liga",
      nationalities: ["Spain", "Brazil", "Spain"],
      scope: "Spain",
      sport: "football",
      tracked_athletes: "89",
    },
    {
      aggregated_ig_followers: "42000000",
      country_flag_url: "",
      id: "3059933633278878705",
      key_athletes: [],
      league_type: "tour",
      logo_url: null,
      name: "ATP Tour",
      nationalities: [],
      scope: "world",
      sport: "tennis",
      tracked_athletes: "216",
    },
    {
      aggregated_ig_followers: null,
      country_flag_url: "",
      id: "8372815033546819479",
      key_athletes: [],
      league_type: "cup",
      logo_url: "",
      name: "UEFA Europa League",
      nationalities: [],
      scope: "World",
      sport: "football",
      tracked_athletes: "0",
    },
  ],
};

const buildTestApp = async (): Promise<FastifyInstance> =>
  await buildApp({ clickhouse: stubClickhouse(rows), config: testConfig });

describe("GET /leagues", () => {
  it("returns the enriched league list on the app surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/leagues?limit=25&offset=0",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<ListLeaguesReply>();

    expect(body.meta).toEqual({ limit: 25, offset: 0, total: 3 });
    expect(body.data[0]).toEqual({
      country: "Spain",
      countryFlagUrl: "https://media.api-sports.io/flags/es.svg",
      id: "2805663106422782827",
      igReach: 184_000_000,
      keyAthletes: [
        { id: 686, name: "Kylian Mbappé" },
        { id: 706, name: "Vinícius Júnior" },
      ],
      leagueType: "club_league",
      logoUrl: "https://media.api-sports.io/football/leagues/140.png",
      name: "La Liga",
      nationalities: ["Brazil", "Spain"],
      sport: "football",
      trackedAthletes: 89,
    });
    await app.close();
  });

  it("reports a worldwide competition as having no country", async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: "GET", url: "/app/leagues" });
    const { data } = response.json<ListLeaguesReply>();

    expect(data[1]).toMatchObject({ country: null, countryFlagUrl: null });
    expect(data[2]).toMatchObject({
      country: null,
      igReach: 0,
      logoUrl: null,
      trackedAthletes: 0,
    });
    await app.close();
  });

  it("serves the same payload on the v1 developer surface", async () => {
    const app = await buildTestApp();

    const appResponse = await app.inject({
      method: "GET",
      url: "/app/leagues?limit=25&offset=0",
    });
    const v1Response = await app.inject({
      method: "GET",
      url: "/v1/leagues?limit=25&offset=0",
    });

    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json()).toEqual(appResponse.json());
    await app.close();
  });

  it("keeps filter options off the v1 developer surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/v1/leagues/filter-options",
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns the catalog sports on the app surface", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/leagues/filter-options",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sports: ["football", "tennis"] });
    await app.close();
  });

  it("accepts every filter the list supports", async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/app/leagues?name=liga&sports=football&sports=tennis&minTrackedAthletes=5&minAggregatedIgFollowers=1000000&megaOnly=true&sortBy=igReach&sortDirection=asc",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it.each([
    ["invalid pagination", "/app/leagues?limit=9999"],
    ["an unsupported sort column", "/app/leagues?sortBy=reach"],
    ["an unsupported sort direction", "/app/leagues?sortDirection=widest"],
    ["a negative athlete threshold", "/app/leagues?minTrackedAthletes=-1"],
    ["a blank name", "/app/leagues?name="],
  ])("rejects %s", async (_scenario, url) => {
    const app = await buildTestApp();

    const response = await app.inject({ method: "GET", url });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

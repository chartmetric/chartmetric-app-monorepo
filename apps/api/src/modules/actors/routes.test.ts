import type { FastifyInstance } from "fastify";

import { describe, expect, it } from "vitest";

import type { ListActorsReply } from "./routes/list-actors/schemas.ts";

import { buildApp } from "../../app.ts";
import { stubClickhouse, testConfig } from "../../tests/helpers.ts";

const rows = {
  "new_vertical.test_tv_persons": [
    {
      id: 1,
      name: "Actor",
      profile_path: null,
      popularity: 5,
      instagram_handle: "actor",
      instagram_url: "https://instagram.com/actor",
      instagram_followers: "10",
      role_count: "2",
      known_for: "[]",
    },
  ],
};

const request = async (
  url: string,
): Promise<Awaited<ReturnType<FastifyInstance["inject"]>>> => {
  const app = await buildApp({
    clickhouse: stubClickhouse(rows),
    config: testConfig,
  });
  const response = await app.inject({ method: "GET", url });
  await app.close();
  return response;
};

describe("GET /actors", () => {
  it("publishes only the v1 route in the public document", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });
    await app.ready();

    const document = app.swagger() as { paths: Record<string, unknown> };

    expect(document.paths).toHaveProperty("/v1/actors");
    expect(document.paths).not.toHaveProperty("/app/actors");
    await app.close();
  });

  it("serves the same paginated contract on app and v1 surfaces", async () => {
    const appResponse = await request("/app/actors?limit=25&offset=0");
    const v1Response = await request("/v1/actors?limit=25&offset=0");

    expect(appResponse.statusCode).toBe(200);
    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json<ListActorsReply>()).toEqual(appResponse.json());
    expect(appResponse.json<ListActorsReply>().meta).toEqual({
      limit: 25,
      offset: 0,
      total: 1,
    });
  });

  it.each([
    "/app/actors?limit=0",
    "/app/actors?sortBy=followers",
    "/app/actors?sortDirection=sideways",
  ])("rejects invalid query values: %s", async (url) => {
    const response = await request(url);

    expect(response.statusCode).toBe(400);
  });
});

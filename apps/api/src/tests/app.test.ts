import { describe, expect, it } from "vitest";

import { buildApp } from "../app.ts";
import { stubClickhouse, testConfig } from "./helpers.ts";

describe("buildApp", () => {
  it("enables CORS on /app but not on /v1", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });
    const origin = "https://app.chartmetric.com";

    const appResponse = await app.inject({
      headers: { origin },
      method: "GET",
      url: "/app/artists",
    });
    expect(appResponse.headers["access-control-allow-origin"]).toBe(origin);

    const v1Response = await app.inject({
      headers: { origin },
      method: "GET",
      url: "/v1/artists",
    });
    expect(v1Response.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });

  it("restricts CORS to the configured allowlist", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: { ...testConfig, corsOrigins: ["https://allowed.example"] },
    });

    const allowed = await app.inject({
      headers: { origin: "https://allowed.example" },
      method: "GET",
      url: "/app/artists",
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://allowed.example",
    );

    const blocked = await app.inject({
      headers: { origin: "https://evil.example" },
      method: "GET",
      url: "/app/artists",
    });
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });

  it("serves the health check without touching ClickHouse", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });

  it("documents the v1 surface but hides /app routes", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url: "/openapi.json" });

    expect(response.statusCode).toBe(200);
    const document = response.json<{
      openapi: string;
      paths: Record<string, unknown>;
    }>();
    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(["/health", "/v1/artists"]),
    );
    expect(
      Object.keys(document.paths).filter((route) => route.startsWith("/app")),
    ).toEqual([]);
    await app.close();
  });

  it("serves the docs UI", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });

    const response = await app.inject({ method: "GET", url: "/docs" });

    expect(response.statusCode).toBeLessThan(400);
    await app.close();
  });
});

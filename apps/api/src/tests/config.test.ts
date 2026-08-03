import { describe, expect, it } from "vitest";

import { loadConfig } from "../config.ts";

const requiredEnvironment = {
  AUTHSERVICE_URL: "http://localhost:3000",
  CLICKHOUSE_HOST: "https://clickhouse.example.com:8443",
  CLICKHOUSE_PASSWORD: "secret",
  CLICKHOUSE_USER: "reader",
};

describe("loadConfig", () => {
  it("applies defaults for optional values", () => {
    expect(loadConfig(requiredEnvironment)).toEqual({
      authServiceUrl: requiredEnvironment.AUTHSERVICE_URL,
      clickhouseHost: requiredEnvironment.CLICKHOUSE_HOST,
      clickhousePassword: requiredEnvironment.CLICKHOUSE_PASSWORD,
      clickhouseUser: requiredEnvironment.CLICKHOUSE_USER,
      host: "0.0.0.0",
      logLevel: "info",
      port: 8080,
    });
  });

  it("leaves corsOrigins undefined when CORS_ORIGIN is unset", () => {
    expect(loadConfig(requiredEnvironment).corsOrigins).toBeUndefined();
  });

  it("splits and trims a comma-separated CORS_ORIGIN", () => {
    const config = loadConfig({
      ...requiredEnvironment,
      CORS_ORIGIN: "https://app.chartmetric.com, http://localhost:5173",
    });

    expect(config.corsOrigins).toEqual([
      "https://app.chartmetric.com",
      "http://localhost:5173",
    ]);
  });

  it("coerces PORT to a number", () => {
    expect(loadConfig({ ...requiredEnvironment, PORT: "3000" }).port).toBe(
      3000,
    );
  });

  it("fails fast when a ClickHouse variable is missing", () => {
    expect(() =>
      loadConfig({
        CLICKHOUSE_PASSWORD: requiredEnvironment.CLICKHOUSE_PASSWORD,
        CLICKHOUSE_USER: requiredEnvironment.CLICKHOUSE_USER,
      }),
    ).toThrow(/CLICKHOUSE_HOST/);
  });

  it("fails fast when AUTHSERVICE_URL is missing", () => {
    expect(() =>
      loadConfig({ ...requiredEnvironment, AUTHSERVICE_URL: undefined }),
    ).toThrow(/AUTHSERVICE_URL/);
  });

  it("rejects an unknown LOG_LEVEL", () => {
    expect(() =>
      loadConfig({ ...requiredEnvironment, LOG_LEVEL: "verbose" }),
    ).toThrow(/LOG_LEVEL/);
  });

  it("rejects an out-of-range PORT", () => {
    expect(() => loadConfig({ ...requiredEnvironment, PORT: "70000" })).toThrow(
      /PORT/,
    );
  });
});

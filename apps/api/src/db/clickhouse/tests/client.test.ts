import http from "node:http";
import https from "node:https";
import { describe, expect, it } from "vitest";

import { testConfig } from "../../../tests/helpers.ts";
import { buildClientOptions } from "../client.ts";
import { pickClickhouseAgent } from "../http-agent.ts";

describe("buildClientOptions", () => {
  const options = buildClientOptions(testConfig);

  it("carries the production-proven settings", () => {
    expect(options.request_timeout).toBe(60_000);
    expect(options.set_basic_auth_header).toBe(true);
    expect(
      options.clickhouse_settings?.output_format_json_quote_64bit_integers,
    ).toBe(0);
  });

  it("never pins a database — queries use fully-qualified names", () => {
    expect(options).not.toHaveProperty("database");
  });

  it("passes the host URL and credentials through", () => {
    expect(options.url).toBe(testConfig.clickhouseHost);
    expect(options.username).toBe(testConfig.clickhouseUser);
    expect(options.password).toBe(testConfig.clickhousePassword);
  });
});

describe("pickClickhouseAgent", () => {
  it("selects the plain-http agent for http URLs", () => {
    const agent = pickClickhouseAgent("http://localhost:8123");
    expect(agent).toBeInstanceOf(http.Agent);
    expect(agent).not.toBeInstanceOf(https.Agent);
  });

  it("selects the https agent otherwise", () => {
    expect(pickClickhouseAgent("https://ch.example.com:8443")).toBeInstanceOf(
      https.Agent,
    );
  });
});

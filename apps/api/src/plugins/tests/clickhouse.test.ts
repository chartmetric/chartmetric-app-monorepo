import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { testConfig } from "../../tests/helpers.ts";
import { clickhousePlugin } from "../clickhouse.ts";

describe("clickhousePlugin", () => {
  it("decorates the instance and closes the client on shutdown", async () => {
    const app = Fastify({ logger: false });
    await app.register(clickhousePlugin, { config: testConfig });

    expect(app.clickhouse.client).toBeDefined();
    expect(app.clickhouse.db).toBeDefined();

    await expect(app.close()).resolves.toBeUndefined();
  });
});

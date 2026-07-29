import fp from "fastify-plugin";

import type { Config } from "../config.ts";

import { type ClickHouse, createClickhouse } from "../db/clickhouse/client.ts";
import { destroyClickhouseAgents } from "../db/clickhouse/http-agent.ts";

declare module "fastify" {
  interface FastifyInstance {
    clickhouse: ClickHouse;
  }
}

export interface ClickhousePluginOptions {
  config: Config;
}

export const clickhousePlugin = fp<ClickhousePluginOptions>(
  (fastify, options, done) => {
    const clickhouse = createClickhouse(options.config);

    // Health signal only — never delay startup on a ClickHouse blip.
    void clickhouse.client
      .ping()
      .then((result) => {
        if (!result.success) {
          fastify.log.error("clickhouse ping failed");
        }
      })
      .catch((error: unknown) => {
        fastify.log.error({ err: error }, "clickhouse ping errored");
      });

    fastify.decorate("clickhouse", clickhouse);
    fastify.addHook("onClose", async () => {
      await clickhouse.client.close();
      destroyClickhouseAgents();
    });

    done();
  },
  { name: "clickhouse" },
);

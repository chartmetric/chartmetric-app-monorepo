import { type ClickHouseClient, createClient } from "@clickhouse/client";
import { createQueryBuilder, logger } from "@hypequery/clickhouse";

import type { Config } from "../../config.ts";
import type { Database } from "./schema.ts";

import { pickClickhouseAgent } from "./http-agent.ts";

export type ClickHouseDatabase = ReturnType<
  typeof createQueryBuilder<Database>
>;

export interface ClickHouse {
  client: ClickHouseClient;
  db: ClickHouseDatabase;
}

export const buildClientOptions = (
  config: Config,
): NonNullable<Parameters<typeof createClient>[0]> => ({
  application: "chartmetric-app-api",
  http_agent: pickClickhouseAgent(config.clickhouseHost),
  password: config.clickhousePassword,
  request_timeout: 60_000,
  // must be explicit when a custom http_agent is provided
  set_basic_auth_header: true,
  url: config.clickhouseHost,
  username: config.clickhouseUser,
});

export const createClickhouse = (config: Config): ClickHouse => {
  logger.configure({ level: "warn" });

  const client = createClient(buildClientOptions(config));
  const database = createQueryBuilder<Database>({
    client,
    url: config.clickhouseHost,
  });

  return { client, db: database };
};

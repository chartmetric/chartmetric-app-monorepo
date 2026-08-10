import process from "node:process";

import type { Config } from "../../config.ts";

import { type ClickHouse, createClickhouse } from "./client.ts";

const REQUIRED_ENV_VARS = [
  "CLICKHOUSE_HOST",
  "CLICKHOUSE_USER",
  "CLICKHOUSE_PASSWORD",
] as const;

interface SmokeCredentials {
  host: string;
  password: string;
  user: string;
}

export const resolveSmokeCredentials = (
  env: NodeJS.ProcessEnv = process.env,
): SmokeCredentials => {
  const present = {} as Record<(typeof REQUIRED_ENV_VARS)[number], string>;
  const missing = REQUIRED_ENV_VARS.filter((name) => {
    const value = env[name];
    if (value === undefined || value.length === 0) {
      return true;
    }
    present[name] = value;
    return false;
  });

  if (missing.length > 0) {
    throw new Error(
      `Smoke tests need real ClickHouse credentials; missing ${missing.join(
        ", ",
      )}. Set them in apps/api/.env.`,
    );
  }

  return {
    host: present.CLICKHOUSE_HOST,
    password: present.CLICKHOUSE_PASSWORD,
    user: present.CLICKHOUSE_USER,
  };
};

export const createSmokeClickhouse = (
  env: NodeJS.ProcessEnv = process.env,
): ClickHouse => {
  const credentials = resolveSmokeCredentials(env);
  const config: Config = {
    authServiceUrl: "",
    clickhouseHost: credentials.host,
    clickhousePassword: credentials.password,
    clickhouseUser: credentials.user,
    corsOrigins: undefined,
    host: "127.0.0.1",
    logLevel: "warn",
    port: 8080,
  };

  return createClickhouse(config);
};

export interface ExecutableQuery<Row> {
  execute: () => Promise<Row[]>;
}

export const executeSmokeQuery = async <Row>(
  label: string,
  query: ExecutableQuery<Row>,
): Promise<Row[]> => {
  try {
    return await query.execute();
  } catch (error) {
    throw new Error(`ClickHouse rejected smoke query "${label}"`, {
      cause: error,
    });
  }
};

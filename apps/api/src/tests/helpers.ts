import type { Config } from "../config.ts";
import type { ClickHouse } from "../db/clickhouse/client.ts";
import type { Database } from "../db/clickhouse/schema.ts";

export const testConfig: Config = {
  authServiceUrl: "https://auth-service.invalid:3000",
  clickhouseHost: "https://clickhouse.invalid:8443",
  clickhousePassword: "secret",
  clickhouseUser: "reader",
  corsOrigins: undefined,
  host: "127.0.0.1",
  logLevel: "fatal",
  port: 8080,
};

type StubRows = Partial<Record<keyof Database, unknown[]>>;

interface StubChain {
  execute: () => Promise<unknown[]>;
  final: () => StubChain;
  limit: () => StubChain;
  offset: () => StubChain;
  orderBy: () => StubChain;
  select: () => StubChain;
  settings: () => StubChain;
  toSQL: () => string;
  where: () => StubChain;
}

export const stubClickhouse = (rowsByTable: StubRows = {}): ClickHouse => {
  const buildChain = (table: keyof Database): StubChain => {
    const chain: StubChain = {
      execute: async () => {
        await Promise.resolve();
        return rowsByTable[table] ?? [];
      },
      final: () => chain,
      limit: () => chain,
      offset: () => chain,
      orderBy: () => chain,
      select: () => chain,
      settings: () => chain,
      toSQL: () => "",
      where: () => chain,
    };

    return chain;
  };

  return {
    client: {
      close: async () => {
        await Promise.resolve();
      },
    },
    db: { table: buildChain },
  } as unknown as ClickHouse;
};

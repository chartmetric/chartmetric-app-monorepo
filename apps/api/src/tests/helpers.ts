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
  argMax: () => StubChain;
  execute: () => Promise<unknown[]>;
  final: () => StubChain;
  groupBy: () => StubChain;
  innerJoin: () => StubChain;
  leftAnyJoin: () => StubChain;
  limit: () => StubChain;
  max: () => StubChain;
  offset: () => StubChain;
  orderBy: () => StubChain;
  select: () => StubChain;
  settings: () => StubChain;
  toSQL: () => string;
  where: () => StubChain;
  whereNull: () => StubChain;
  withCTE: () => StubChain;
}

export const stubClickhouse = (rowsByTable: StubRows = {}): ClickHouse => {
  const buildChain = (table: keyof Database): StubChain => {
    const chain: StubChain = {
      argMax: () => chain,
      execute: async () => {
        await Promise.resolve();
        return rowsByTable[table] ?? [];
      },
      final: () => chain,
      groupBy: () => chain,
      innerJoin: () => chain,
      leftAnyJoin: () => chain,
      limit: () => chain,
      max: () => chain,
      offset: () => chain,
      orderBy: () => chain,
      select: () => chain,
      settings: () => chain,
      toSQL: () => "",
      where: () => chain,
      whereNull: () => chain,
      withCTE: () => chain,
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

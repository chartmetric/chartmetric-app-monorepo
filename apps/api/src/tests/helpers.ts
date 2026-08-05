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
  count: () => StubChain;
  countDistinct: () => StubChain;
  execute: () => Promise<unknown[]>;
  final: () => StubChain;
  groupBy: () => StubChain;
  innerJoin: () => StubChain;
  leftAnyJoin: () => StubChain;

  leftJoin: () => StubChain;
  limit: () => StubChain;
  max: () => StubChain;
  offset: () => StubChain;
  orderBy: () => StubChain;
  select: (columns?: unknown) => StubChain;
  settings: () => StubChain;
  toSQL: () => string;
  where: () => StubChain;
  whereNull: () => StubChain;

  whereNotNull: () => StubChain;
  withCTE: () => StubChain;
}

// The count query selects `count()` as an aliased expression rather than a
// column string, so the stub inspects both forms.
const isCountSelection = (column: unknown): boolean => {
  if (typeof column === "string") return column.startsWith("count()");
  if (typeof column !== "object" || column === null) return false;

  const { toSql } = column as { toSql?: () => string };

  return typeof toSql === "function" && toSql().startsWith("count()");
};

const isAggregateSelection = (columns: unknown): boolean =>
  Array.isArray(columns) && columns.some((column) => isCountSelection(column));

export const stubClickhouse = (rowsByTable: StubRows = {}): ClickHouse => {
  const buildChain = (table: keyof Database): StubChain => {
    let isSelectsAggregate = false;
    const chain: StubChain = {
      argMax: () => chain,
      count: () => chain,
      countDistinct: () => chain,

      execute: async () => {
        await Promise.resolve();

        const rows = rowsByTable[table] ?? [];

        // A count query runs the same builder against the same table, so the
        // stub answers it from the row count it would otherwise return.
        return isSelectsAggregate ? [{ total: rows.length }] : rows;
      },
      final: () => chain,
      groupBy: () => chain,
      innerJoin: () => chain,
      leftAnyJoin: () => chain,

      leftJoin: () => chain,
      limit: () => chain,
      max: () => chain,
      offset: () => chain,
      orderBy: () => chain,
      select: (columns?: unknown) => {
        if (isAggregateSelection(columns)) isSelectsAggregate = true;

        return chain;
      },
      settings: () => chain,
      toSQL: () => "",
      where: () => chain,
      whereNull: () => chain,

      whereNotNull: () => chain,
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

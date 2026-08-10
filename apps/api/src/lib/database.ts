import type { ClickHouseDatabase } from "../db/clickhouse/client.ts";
import type { Database } from "../db/clickhouse/schema.ts";

export type DatabaseQueryFactory = (database: ClickHouseDatabase) => unknown;

/**
 * The part of a hypequery builder a route consumes, with the row type stated
 * rather than inferred. The generated schema describes `Int64` as a number even
 * though ClickHouse renders it as a string in JSON, so each endpoint declares its
 * own corrected row shape and annotates its query with it.
 */
export interface ExecutableQuery<Row> {
  execute: () => Promise<Row[]>;
  getQueryNode: () => { settings: Record<string, unknown> };
  toSQL: () => string;
  toSQLWithParams: () => { parameters: unknown[]; sql: string };
}

export type TablesWithColumn<Column extends string> = {
  [
    Table in Extract<keyof Database, string>
  ]: Column extends keyof Database[Table] ? Table : never;
}[Extract<keyof Database, string>];

// hypequery cannot type a CTE alias as a join source, `innerJoin`/`leftAnyJoin`
// take only an unqualified left column — which ClickHouse rejects with
// AMBIGUOUS_IDENTIFIER once two joined sources share it — and `orderBy` accepts
// only a schema column, never a CTE-qualified one or an expression such as
// `<column> IS NULL`. All of these typecheck either way, so anything built
// through this must be run against real ClickHouse. Enter it for the untypable
// step alone — take the builder as a generic parameter, cast in, cast the result
// back — so the rest of the chain keeps its generated-schema types.
export interface JoinableChain {
  innerJoin: (
    source: string,
    leftColumn: string,
    rightColumn: string,
  ) => JoinableChain;
  leftAnyJoin: (
    source: string,
    leftColumn: string,
    rightColumn: string,
  ) => JoinableChain;
  orderBy: (column: string, direction: "ASC" | "DESC") => JoinableChain;
  withCTE: (alias: string, subquery: unknown) => JoinableChain;
}

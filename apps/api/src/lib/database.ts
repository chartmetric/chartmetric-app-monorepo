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

// hypequery cannot type a CTE alias as a join source, and `leftAnyJoin` takes
// only an unqualified left column — which ClickHouse rejects with
// AMBIGUOUS_IDENTIFIER once two joined sources share it. Both typecheck either
// way, so anything built through this must be run against real ClickHouse.
export interface JoinableChain {
  leftAnyJoin: (
    source: string,
    leftColumn: string,
    rightColumn: string,
  ) => JoinableChain;
  withCTE: (alias: string, subquery: unknown) => JoinableChain;
}

// `orderBy` cannot be typed when the order key is an expression or a column of
// a CTE the builder state does not know. Same caveat as JoinableChain: this
// typechecks either way, so the ordering must be run against real ClickHouse.
export interface OrderableChain {
  orderBy: (column: string, direction: "ASC" | "DESC") => OrderableChain;
}

export const orderByExpression = <Builder>(
  builder: Builder,
  expression: string,
  direction: "ASC" | "DESC",
): Builder =>
  (builder as unknown as OrderableChain).orderBy(
    expression,
    direction,
  ) as unknown as Builder;

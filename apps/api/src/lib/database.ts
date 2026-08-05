import type { ClickHouseDatabase } from "../db/clickhouse/client.ts";
import type { Database } from "../db/clickhouse/schema.ts";

/**
 * A governed query definition: it takes the database handle and returns a
 * builder. Queries are written as `((database) => …) satisfies
 * DatabaseQueryFactory` so the builder keeps its inferred type — an explicit
 * return annotation would erase it — while the handle stays the only injected
 * dependency.
 */
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

/**
 * Every warehouse table carrying `Column`, so a join key can be checked against
 * the generated schema instead of trusted: `TablesWithColumn<"profile_id">`
 * rejects both a misspelled table and a real table with nothing to join on.
 */
export type TablesWithColumn<Column extends string> = {
  [
    Table in Extract<keyof Database, string>
  ]: Column extends keyof Database[Table] ? Table : never;
}[Extract<keyof Database, string>];

/**
 * A structural view of a builder, for the joins hypequery's typed API cannot
 * express. It types `withCTE` against its own builder type and every join against
 * the generated schema, and `leftAnyJoin` accepts only an *unqualified* left
 * column. That rules out two things any query with subqueries needs:
 *
 * - joining a CTE alias, which is not a table in the generated schema;
 * - qualifying the left join key, which becomes mandatory as soon as more than
 *   one joined source shares that column name. ClickHouse fails the whole query
 *   with `AMBIGUOUS_IDENTIFIER` rather than picking a side, and it typechecks
 *   either way — so a query built this way must be run against real ClickHouse.
 *
 * Use it for the join wiring only and hand the builder back out unchanged, so the
 * base table, filters, and column selection stay checked. Read columns that come
 * from a CTE back with `rawAs`.
 */
export interface JoinableChain {
  leftAnyJoin: (
    source: string,
    leftColumn: string,
    rightColumn: string,
  ) => JoinableChain;
  withCTE: (alias: string, subquery: unknown) => JoinableChain;
}

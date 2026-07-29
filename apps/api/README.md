# API

A Fastify server that reads from ClickHouse using a fully type-safe query
builder ([hypequery](https://hypequery.com)). Column names and types are
checked at compile time, so a typo in a query or a schema change in the
database shows up as a TypeScript error instead of a runtime failure.

## 1. Setup

Copy the example env file and fill in the ClickHouse credentials (ask the team
for the read-only ones):

```sh
cp .env.example .env
```

## 2. How the ClickHouse types work

TypeScript can't look inside a live database, so we take a snapshot of the
schema and commit it as generated code:

```sh
pnpm generate:ch-schema
```

This command:

1. Scans our source code for every `.table("new_vertical.<name>")` call, so
   only tables we actually query are included — nothing to maintain by hand.
2. Connects to ClickHouse (using your `.env`) and reads the real column names
   and types for those tables.
3. Writes them into a generated TypeScript file that the query builder uses
   for autocomplete and type checking.

The generated file is committed. It contains only table/column names and
types — no data and no credentials — so it is safe to have in the repo.
You never edit it by hand; rerun the command instead.

## 3. Writing queries

Each module groups its queries in a factory that receives the query builder
once, so individual queries never pass a database handle around. Routes create
the factory a single time when they register:

```ts
export const createArtistQueries = (database: ClickHouseDatabase) => ({
  listArtists: (pagination: PaginationQuery) =>
    database
      .table("new_vertical.cm_artist")
      .select(["id", "name", "image_url"])
      .final()
      .orderBy("id", "ASC")
      .limit(pagination.limit)
      .offset(pagination.offset),
});

// in the route plugin — bound once, reused by every request
const queries = createArtistQueries(fastify.clickhouse.db);
```

Everything is typed end to end: `.table()` only accepts known tables (always
fully qualified as `database.table`), `.select()` and `.where()` only accept
that table's columns, and the rows returned by `.execute()` are typed to match
your `.select()`.

Two ClickHouse-specific habits to keep:

- Add `.final()` when reading a `ReplacingMergeTree` table, otherwise recently
  updated rows can appear twice until ClickHouse merges them.
- Filter soft-deleted rows (`deleted_at`, `active`) where the table has them.

### Querying a table for the first time

1. Write the query with `.table("new_vertical.<name>")` as usual.
2. Run `pnpm generate:ch-schema` — the scan picks up the new table and adds
   its types to the snapshot.
3. Commit the regenerated file together with your query.

If TypeScript complains that your table doesn't exist, that's the signal that
step 2 hasn't been run yet. The same applies when a table's columns change in
ClickHouse: rerun the command and the types update.

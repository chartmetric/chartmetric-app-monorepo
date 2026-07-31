# API

A Fastify server that reads from ClickHouse using a fully type-safe query
builder ([hypequery](https://hypequery.com)). Column names and types are
checked at compile time, so a typo in a query or a schema change in the
database shows up as a TypeScript error instead of a runtime failure.

## How it works, in plain terms

Think of one request passing through three stations:

1. **The front door (Fastify + TypeBox).** Every route declares schemas for
   its request and response. Request schemas are handwritten because they
   carry runtime validation constraints. Response schemas are generated from
   the mapper's inferred TypeScript return type. Fastify validates input,
   shapes output, and gives the same schemas to the API docs.
2. **The kitchen (queries + mapper).** The route handler asks the module's
   queries for data (built with hypequery, so a wrong column name won't even
   compile) and the module's mapper reshapes raw database rows into the
   clean API response (e.g. turning ClickHouse's `''` into proper `null`).
3. **The pantry (ClickHouse).** Where the data actually lives. The API only
   reads from it.

```
            GET /v1/artists?limit=3
                     │
        ┌────────────▼─────────────────────────┐
        │ FASTIFY  (the web server)            │
        │  1. validate input   ← TypeBox schema│
        │  2. run the handler:                 │
        │       queries.ts ──hypequery──► ClickHouse
        │       mapper.ts   rows → API shape   │
        │  3. shape output ← generated schema │
        └────────────┬─────────────────────────┘
                     ▼
               JSON response

   The same TypeBox schemas also feed /openapi.json,
   which /docs renders as browsable documentation.
```

### Who does what

| Package                          | Role in one sentence                                                                             | Docs                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `fastify`                        | The web server: routing, request lifecycle, logging.                                             | [fastify.dev](https://fastify.dev/docs/latest/)                                                              |
| `@sinclair/typebox`              | Defines request validation and hosts generated response schemas for Fastify and OpenAPI.         | [github.com/sinclairzx81/typebox](https://github.com/sinclairzx81/typebox)                                   |
| `@fastify/type-provider-typebox` | The glue that makes Fastify infer TS types from those schemas automatically.                     | [github.com/fastify/fastify-type-provider-typebox](https://github.com/fastify/fastify-type-provider-typebox) |
| `@fastify/sensible`              | Small quality-of-life helpers, mainly standard HTTP errors like `fastify.httpErrors.notFound()`. | [github.com/fastify/fastify-sensible](https://github.com/fastify/fastify-sensible)                           |
| `@fastify/swagger`               | Walks every route's schema and generates the OpenAPI spec at `/openapi.json`.                    | [github.com/fastify/fastify-swagger](https://github.com/fastify/fastify-swagger)                             |
| `@scalar/fastify-api-reference`  | Renders that spec as the interactive docs page at `/docs`.                                       | [scalar.com](https://guides.scalar.com/scalar/scalar-api-references/integrations/fastify)                    |
| `@hypequery/clickhouse`          | Type-safe ClickHouse query builder — tables and columns are checked at compile time.             | [hypequery.com](https://hypequery.com/docs/)                                                                 |

The API is served twice under two prefixes: `/app/*` for our own web app and
`/v1/*` for external developers. Same routes, different future auth — and only
`/v1` appears in the public docs.

Response contract generation runs automatically under `pnpm dev`. For a
one-off regeneration, run:

```sh
pnpm --filter api generate
```

The first generation on a machine compiles Typia's transformer and requires a
Go toolchain; subsequent runs reuse its cache. This is a development and CI
requirement only.

The mapper marks its public response with `defineApiResponse(mapper)`. The
response schema generator infers the mapper return type, OpenAPI consumes the
generated Fastify schema, and the frontend client consumes OpenAPI. `pnpm
check:generated` runs the full chain and fails in CI if any committed artifact
is stale.

For a new response:

1. Create a mapper in any non-test TypeScript file under `src/modules`.
2. Export the mapper and mark the public response:

   ```ts
   import { defineApiResponse } from "../../lib/api-response.ts";

   export const toArtistDetail = (row: ArtistDetailRow) => ({
     id: row.id,
     name: row.name,
   });

   export const ArtistDetail = defineApiResponse(toArtistDetail);
   ```

3. Run `pnpm --filter api generate`. The generator emits the inferred
   `ArtistDetailReply` type and `ArtistDetailReplySchema` in the module's
   `schemas.generated.ts`.
4. Import that schema in the route's `schema.response`.

No filename convention, reply-type suffix, generator registry, or
field-by-field response schema is required. To update the committed OpenAPI
snapshot and frontend client as well, run:

```sh
pnpm generate:api-client
```

The live `/openapi.json` and `/docs` endpoints follow the regenerated Fastify
schema automatically. Production builds use committed generated files and do
not execute Typia. TypeScript only exposes ordinary numeric values as `number`,
so use explicit Typia numeric metadata when OpenAPI must distinguish integers;
never edit generated output to add that distinction.

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

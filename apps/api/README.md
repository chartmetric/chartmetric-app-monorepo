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

The API has two prefixes: `/app/*` for our own web app and `/v1/*` for external
developers. Each route explicitly chooses one or both surfaces, and only `/v1`
appears in the public docs.

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

The full endpoint workflow below covers response generation together with data
selection, surface registration, tests, OpenAPI, and the frontend client.

## 1. Setup

From the repository root, copy the API example env file and fill in the
ClickHouse credentials (ask the team for the read-only ones):

```sh
cp apps/api/.env.example apps/api/.env
```

The API reads `apps/api/.env`; a repository-root `.env` is ignored. Local Vite
development proxies `/app` through the frontend origin, so it does not require
CORS configuration. Set `API_PROXY_TARGET` in `apps/web/.env` only when the
local API is not running at `http://127.0.0.1:8008`. `CORS_ORIGIN` is required
only for clients that call the API directly from another origin.

## 2. How the ClickHouse types work

TypeScript can't look inside a live database, so we take a snapshot of the
schema and commit it as generated code:

```sh
pnpm --filter api generate:ch-schema
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
2. Run `pnpm --filter api generate:ch-schema` — the scan picks up the new table and adds
   its types to the snapshot.
3. Commit the regenerated file together with your query.

If TypeScript complains that your table doesn't exist, that's the signal that
step 2 hasn't been run yet. The same applies when a table's columns change in
ClickHouse: rerun the command and the types update.

## Adding or changing an endpoint

Run these commands from the repository root. A new endpoint moves through each
gate in order; when changing an endpoint, update its contract test first and
observe the expected failure before changing implementation code.

### 1. Resolve the endpoint preflight

Before editing, decide:

- Whether the route belongs on `/app`, `/v1`, or both. Decide this first and
  explicitly: `/v1` publishes the route to external developers in `/docs` and
  `openapi.json`, and a published contract cannot be quietly withdrawn.
- Its method, path, request shape, response shape, pagination, sorting, and errors.
- Its source tables, selected columns, row filters, and null normalization.
- Its product, permission, API-scope, and authentication requirements.

List tables already committed to the ClickHouse snapshot:

```sh
pnpm --filter api endpoint:inspect
```

List columns for one table:

```sh
pnpm --filter api endpoint:inspect -- --table cm_artist
```

Use `--live` to inspect the real ClickHouse schema with the credentials in
`apps/api/.env`. Live inspection reads schema metadata only and does not sample
application rows:

```sh
pnpm --filter api endpoint:inspect -- --live --table cm_artist
```

### 2. Scaffold the red contract test

Run the interactive preflight:

```sh
pnpm --filter api create:endpoint
```

The command refuses incomplete surface, data, request, response, error, or
access decisions. It displays the chosen schema and asks for confirmation,
then creates:

```text
src/modules/<module>/tests/<route>.contract.test.ts
```

The test asserts the Fastify method and path, `/app` and `/v1` registration,
public OpenAPI visibility, and the complete internal contract. Run the command
it prints and confirm that the test fails because the route is not registered.
Use `pnpm --filter api create:endpoint -- --help` for non-interactive agent
flags. Repeat `--table <name> --columns <csv>` for endpoints that join or
combine multiple sources; explicitly pass `--table none --columns none` when
the endpoint does not read ClickHouse. Add `--live` when a selected table is
not yet in the committed snapshot.

### 3. Create the query

Add or update `src/modules/<module>/queries.ts` with a fully qualified table:

```ts
database.table("new_vertical.cm_artist");
```

Then regenerate the ClickHouse snapshot:

```sh
pnpm --filter api generate:ch-schema
```

Never edit `src/db/clickhouse/schema.generated.ts` manually.

Before adding the response marker or running response generation, verify that
the query source compiles:

```sh
pnpm --filter api typecheck
```

When an optional request property is used inside a query-builder callback,
capture it after narrowing. TypeScript does not retain an object-property
narrowing inside a deferred callback:

```ts
if (query.name !== undefined) {
  const name = query.name;
  builder = builder.where((predicate) =>
    predicate.fn("example", predicate.value(name)),
  );
}
```

If response generation reports a source compilation failure, fix the first
TypeScript error above it and rerun the typecheck. Do not edit
`schemas.generated.ts` to resolve a source error.

### 4. Create the public response mapper

Create a mapper in any non-test TypeScript file inside the module. Normalize
database-specific values there and mark the public response:

```ts
import { defineApiResponse } from "../../lib/api-response.ts";

export const toArtistList = (rows: ArtistRow[]) => ({
  data: rows.map((row) => ({ id: row.id, name: row.name })),
});

export const ListArtists = defineApiResponse(toArtistList);
```

Root `pnpm dev` regenerates the response schema automatically. Without the
watcher, run:

```sh
pnpm --filter api generate
```

The marker name produces `ListArtistsReply` and `ListArtistsReplySchema` in
the module's `schemas.generated.ts`. Mapper filenames are unrestricted, and
generated files are never edited manually.

### 5. Create and register the route

Create `src/modules/<module>/routes/<route>.ts` with explicit request and
response schemas. Import the generated reply schema into `schema.response`.

Register it in `src/modules/<module>/routes.ts` with its approved surfaces:

```ts
export const artistsRoutes = createApiRoutes([
  { plugin: listArtistsRoute, surfaces: ["app", "v1"] },
]);
```

New modules must also be mounted by `src/routes/app-surface.ts` and
`src/routes/v1-surface.ts`; `createApiRoutes()` filters out routes not intended
for the current surface.

### 6. Complete the TDD contract

Make the generated contract test green, then add route-specific assertions for
request validation, response values, expected errors, and allowed and denied
authorization where applicable.

```sh
pnpm --filter api test src/modules/<module>/tests/<route>.contract.test.ts
pnpm --filter api check:endpoints
```

`check:endpoints` fails when a route is missing its contract test, is absent
from the module registrar, or disagrees with the test about method, path, or
surface. It also verifies every recorded ClickHouse table and column against
the committed generated schema.

### 7. Sync downstream contracts

```sh
pnpm generate:api-client
pnpm check:generated
```

This regenerates response schemas, the OpenAPI snapshot, and the frontend
client. The live `/openapi.json` and `/docs` endpoints follow the Fastify
schemas automatically.

### 8. Validate the API

```sh
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter api test
```

Report the expected red test and the final green checks. Production builds use
committed generated files and do not execute Typia. TypeScript only exposes
ordinary numeric values as `number`, so use explicit Typia numeric metadata
when OpenAPI must distinguish integers; never edit generated output to add that
distinction.

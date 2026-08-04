# API Application Instructions

This directory contains the persistent Fastify backend.

Also follow `/AGENTS.md`, `/apps/AGENTS.md`, `/docs/architecture/access-and-feature-gating.md`, and `/docs/contracts/access-context.md`.

## Skills

Consult the matching skill in `/.agents/skills/` before working in its area:

- `fastify-best-practices` — Fastify plugins, routing, validation, and lifecycle patterns.
- `clickhouse-best-practices` — ClickHouse schema design and query patterns.
- `vitest` — writing and structuring tests.

## API surfaces

- `/app/*`: first-party user/session authentication. CORS is enabled here (allowlist via `CORS_ORIGIN`).
- `/v1/*`: developer API-key authentication, scopes, rate limits, and usage.

Do not mix their authentication assumptions.

The published docs (`/docs`, `/openapi.json`) cover `/v1` and system routes only. The `/app` surface registers an `onRoute` hook that marks its routes `hide: true`, so anything registered there is excluded from the spec automatically while keeping full TypeBox validation. Do not add per-route `hide` flags for this.

## Module layout

Feature code lives under `src/modules/<name>/`:

- `routes.ts` — registrar only; registers one plugin per route.
- `routes.test.ts` — module-level test exercising registration, surfaces, and responses through the app.
- `routes/<route>/` — one folder per endpoint. Standard base names inside, never endpoint-prefixed filenames:
  - `route.ts` — the Fastify plugin: its TypeBox schema block plus a thin handler.
  - `schemas.ts` — handwritten TypeBox request and response contracts; `Static<typeof Schema>` derives the TypeScript types.
  - `queries.ts` — a `create<Route>Queries(database)` factory built once per route plugin; individual queries never pass the database handle around. Row types derive from the queries here.
  - `mapper.ts` — maps database rows to the API shape, with the return type annotated as the reply type from `schemas.ts`.
  - `types.ts` — row and query interfaces when they outgrow `queries.ts`.
  - `tests/` — the endpoint's colocated tests (`mapper.test.ts`, `queries.test.ts`).
- Module-level `schemas.ts` — only for contracts shared across endpoints or consumed outside the module (e.g. auth's `AccessContextSchema`).

`routes.ts` uses `createApiRoutes()` to declare whether each route is available on `app`, `v1`, or both. The surface choice is per route, not per module.

## Endpoint workflow

Before creating or changing an endpoint, follow the canonical [endpoint workflow](./README.md#adding-or-changing-an-endpoint).

Do not edit endpoint code until the existing task or the user has resolved:

- API surface: `/app`, `/v1`, or both.
- Method, path, request contract, response contract, pagination, sorting, and errors.
- Source tables, selected columns, row filters, and null normalization.
- Product, permission, API-scope, and authentication requirements.

Always ask the surface question outright — "should this be a public developer API endpoint?" — for new routes and for surface changes to existing ones. `/v1` publishes the route to external API-key customers in `/docs` and `openapi.json`, which cannot be quietly withdrawn; `/app` alone means the feature never reaches the developer API. Neither is a safe default, and surface is per route, not per module.

Ask only about unresolved decisions. Before asking about ClickHouse data, consult the committed snapshot in `src/db/clickhouse/schema.generated.ts` and show the relevant table and column options. Do not sample application rows unless the user explicitly asks.

## Route rules

Every public route defines request schemas, response schemas, authentication, authorization where required, and expected errors.

## Access model

AuthService returns enabled products and stable resolved permissions.

The API must not interpret Stripe plan names.

Preferred:

```ts
requireProduct(request.accessContext, "sports");
requirePermission(request.accessContext, "exports.create");
```

Forbidden:

```ts
if (stripePlan === "enterprise") {
  allow();
}
```

## Permission creation

Do not create a permission for every endpoint or ordinary feature.

Create one only when access differs by commercial entitlement, organization role, seat, administrative authority, security sensitivity, explicit override, or developer API scope.

Normal charts, filters, fields, and UI improvements usually require no new permission.

## Enforcement

The API is the final authorization boundary. Frontend hiding, disabling, or route guards never replace server checks.

Protected operations require allowed and denied tests.

## OpenAPI

Fastify route schemas are the runtime public contracts consumed by `@fastify/swagger`. Handwritten TypeBox schemas in each module's `schemas.ts` define both requests and responses; use `Type.Integer()` for identifiers and counts so the published contract distinguishes integers from floats.

Runtime `/openapi.json` and `/docs` update from the Fastify schemas. When a public contract changes, run `pnpm generate:api-client` from the repository root to regenerate the committed OpenAPI snapshot and frontend client. CI runs `pnpm check:generated` and fails for stale or untracked artifacts.

hypequery-generated ClickHouse types remain inside the module boundary. The mapper deliberately selects and normalizes the public fields, and its annotated return type ties it to the response contract, so drift between mapper and schema is a compile error and raw database rows never leak.

## Data boundaries

Use Drizzle for PostgreSQL and governed hypequery definitions for ClickHouse. Do not return raw database rows as API contracts or execute arbitrary ClickHouse SQL from feature routes.

ClickHouse specifics:

- Table names are always fully qualified (`new_vertical.<table>`); the client pins no database.
- `src/db/clickhouse/schema.generated.ts` is generated by `pnpm --filter api generate:ch-schema`, which scans the code for `.table("new_vertical.<name>")` usage and introspects only those tables. Rerun it when a query touches a new table or a table's columns change; never hand-edit it.
- Add `.final()` when reading a `ReplacingMergeTree` table, otherwise recently updated rows can appear twice until parts merge.
- Filter soft-deleted rows (`deleted_at`, `active`) and quality flags (`is_duplicate`, `is_non_artist`) where the table has them.
- ClickHouse `String` columns often use `''` as "no value"; normalize to `null` in the service mapping, never in the query.

## Completion checklist

- No Stripe plan logic leaked into product routes.
- No unnecessary permission was introduced.
- Required permissions are server-enforced.
- Request and response schemas are explicit handwritten TypeBox, and mappers are typed against the reply types.
- Public contract changes include the `pnpm generate:api-client` artifacts.
- Data boundaries are preserved.
- `pnpm --filter api generate:ch-schema` was rerun if queries touched new ClickHouse tables or columns.
- New `/app` routes are absent from `/openapi.json`; new `/v1` routes are documented.
- Route tests cover registration on the declared surfaces.
- Relevant tests, lint, types, and builds pass.

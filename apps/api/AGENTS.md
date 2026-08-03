# API Application Instructions

This directory contains the persistent Fastify backend.

Also follow `/AGENTS.md`, `/apps/AGENTS.md`, `/docs/architecture/access-and-feature-gating.md`, and `/docs/contracts/access-context.md`.

## Skills

Consult the matching skill in `/.agents/skills/` before working in its area:

- `fastify-best-practices` — Fastify plugins, routing, validation, and lifecycle patterns.
- `clickhouse-best-practices` — ClickHouse schema design and query patterns.
- `vitest` — writing and structuring tests.
- `api-endpoint-workflow` — mandatory preflight and TDD gates for creating or changing endpoints.

## API surfaces

- `/app/*`: first-party user/session authentication. CORS is enabled here (allowlist via `CORS_ORIGIN`).
- `/v1/*`: developer API-key authentication, scopes, rate limits, and usage.

Do not mix their authentication assumptions.

The published docs (`/docs`, `/openapi.json`) cover `/v1` and system routes only. The `/app` surface registers an `onRoute` hook that marks its routes `hide: true`, so anything registered there is excluded from the spec automatically while keeping full TypeBox validation. Do not add per-route `hide` flags for this.

## Module layout

Feature code lives under `src/modules/<name>/`:

- `routes.ts` — registrar only; registers one plugin per route.
- `routes/<route>.ts` — one file per route: its TypeBox schema block plus a thin handler.
- `queries.ts` — a `create<Name>Queries(database)` factory built once per route plugin; individual queries never pass the database handle around.
- Mapper files — may use any filename; map database rows to API shapes and mark each public response with a top-level `export const PascalCaseName = defineApiResponse(mapper)`.
- `schemas.generated.ts` — generated TypeBox-compatible response contracts; never edit these files manually.
- `schemas.ts` — handwritten TypeBox request contracts when a module has request-specific schemas.
- `types.ts` — row and query interfaces.

`routes.ts` uses `createApiRoutes()` to declare whether each route is available on `app`, `v1`, or both. The surface choice is per route, not per module.

## Endpoint workflow

Before creating or changing an endpoint, use the `api-endpoint-workflow` skill and follow the canonical [endpoint workflow](./README.md#adding-or-changing-an-endpoint).

Do not edit endpoint code until the existing task or the user has resolved:

- API surface: `/app`, `/v1`, or both.
- Method, path, request contract, response contract, pagination, sorting, and errors.
- Source tables, selected columns, row filters, and null normalization.
- Product, permission, API-scope, and authentication requirements.

Always ask the surface question outright — "should this be a public developer API endpoint?" — for new routes and for surface changes to existing ones. `/v1` publishes the route to external API-key customers in `/docs` and `openapi.json`, which cannot be quietly withdrawn; `/app` alone means the feature never reaches the developer API. Neither is a safe default, and surface is per route, not per module.

Ask only about unresolved decisions. Before asking about ClickHouse data, run `pnpm --filter api endpoint:inspect` and show the relevant table and column options. Do not sample application rows unless the user explicitly asks.

For new routes, `pnpm --filter api create:endpoint` records the completed preflight and creates the failing registration/OpenAPI contract test. Run that test and confirm the expected red state before implementation. The route is not ready until the targeted test is green and `pnpm --filter api check:endpoints` passes.

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

Fastify route schemas are the runtime public contracts consumed by `@fastify/swagger`. Handwritten TypeBox schemas define requests.

`pnpm --filter api generate` recursively scans non-test TypeScript files under `src/modules` for exported `defineApiResponse(mapper)` markers. The marker's PascalCase variable name is the contract name: `export const ListArtists = defineApiResponse(toArtistList)` generates `ListArtistsReply` and `ListArtistsReplySchema` in `schemas.generated.ts` beside the marker. The filename and handwritten type aliases do not participate in discovery. Do not register endpoints in the generator.

`pnpm dev` watches and regenerates response schemas. Runtime `/openapi.json` and `/docs` update from the Fastify schemas. When a public response changes, run `pnpm generate:api-client` from the repository root to regenerate the committed response schemas, OpenAPI snapshot, and frontend client. CI runs `pnpm check:generated` and fails for stale or untracked artifacts. Production builds consume the committed artifacts and do not run Typia.

TypeScript represents integer and floating-point values as `number`, so inferred schemas emit `type: "number"` unless the mapper return type carries explicit Typia numeric metadata. Never fix this by editing generated files.

hypequery-generated ClickHouse types remain inside the module boundary. The mapper deliberately selects and normalizes the public fields; its inferred return type feeds response-schema generation, so mapper changes propagate without exposing raw database rows.

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
- Request schemas are explicit and response schemas are generated from mapper return types.
- Public response changes include the `pnpm generate:api-client` artifacts.
- Data boundaries are preserved.
- `pnpm --filter api generate:ch-schema` was rerun if queries touched new ClickHouse tables or columns.
- New `/app` routes are absent from `/openapi.json`; new `/v1` routes are documented.
- Every route has a matching `*.contract.test.ts` with its method, path, and surfaces.
- `pnpm --filter api check:endpoints` passes.
- Relevant tests, lint, types, and builds pass.

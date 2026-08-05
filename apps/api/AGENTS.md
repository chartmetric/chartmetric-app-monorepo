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
  - `types.ts` — every `interface` and `type` the endpoint declares. See "Where types live" below.
  - `tests/` — the endpoint's colocated tests (`mapper.test.ts`, `queries.test.ts`).
- Module-level `schemas.ts` — only for contracts shared across endpoints or consumed outside the module (e.g. auth's `AccessContextSchema`).
- Module-level `<concern>/` — code shared by more than one endpoint goes in a folder named for the concern, using the same base names as a route folder. Athletes has `club/` (`catalog.ts`, `resolution.ts`, `types.ts`, `resolution.test.ts`) and `sport/` (`classification.ts`, `types.ts`, `classification.test.ts`). Do not repeat the folder name in its files — `club/catalog.ts`, not `club/club-catalog.ts` — and do not name a file `index.ts`, which reads as a barrel. Tests sit flat inside the folder, not in a nested `tests/`.
- Module-level `types.ts` — only for types shared across endpoints that belong to no single concern. A concern folder keeps its own `types.ts`.

Keep a file inside `routes/<route>/` while a single endpoint uses it, and promote it to a concern folder only when a second endpoint needs it. A shared file must not live inside one endpoint's folder: the moment a second route folder imports from a sibling route folder, the layout stops telling you what belongs to whom.

Name every folder and file for the concern it holds, and check that the name still describes the contents after each change. Never add a `lib/`, `utils/`, `helpers/`, or `shared/` folder inside a module — a name that says "assorted" hides whether its contents are one endpoint's business or the whole module's, which is the distinction this layout exists to make visible.

An abstract noun is the same failure wearing a domain costume. A file called `taxonomy.ts` accumulated the sport-to-level rules, the sport display label, _and_ a date-of-birth-to-age calculation, because nothing about the name excluded anything; it became `sport/classification.ts` plus `toAge` in `lib/dates.ts`. If you cannot name a file without reaching for a word like taxonomy, helpers, or common, the grouping is wrong — split it by what the code actually does.

`routes.ts` uses `createApiRoutes()` to declare whether each route is available on `app`, `v1`, or both. The surface choice is per route, not per module.

## Where types live

Declare `interface` and `type` in the `types.ts` of the folder that owns them, not beside the code that happens to use them first. A reader looking for the shape of a row, a context object, or a builder escape hatch should have one file to open per folder. Two exceptions, both because the declaration is generated rather than written: TypeBox contracts stay in `schemas.ts`, where `Static<typeof Schema>` derives them, and a type that only names a Fastify or library generic stays inline.

`types.ts` is a leaf: it may import from `src/lib/`, the generated schema, and its module's `types.ts`, and nothing else in its own folder. When a type is a projection of a local runtime constant, invert the dependency rather than importing the value into `types.ts` — declare the union in `types.ts` and have the constant conform with `satisfies`:

```ts
// types.ts
export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "twitter" | "youtube";

// mapper.ts — order matters here, the type does not
const PLATFORM_ORDER = ["instagram", "tiktok", ...] as const satisfies readonly SocialPlatform[];
```

The one type that cannot follow this rule is a builder type derived from a query (`ReturnType<typeof selectRoster>`): hand-writing it would defeat the point, so `types.ts` imports the query type-only and the resulting cycle is erased at compile time.

A type used by two folders moves up, exactly like code does — to the module's `types.ts`, then to `src/lib/`. But shared use is not the only reason to move a type: what matters is what the type knows. A type that describes the query builder or the warehouse belongs in `src/lib/` on first use, however few callers it has, because filing it under a feature makes a platform constraint look like a domain decision. `src/lib/database.ts` holds `DatabaseQueryFactory`, `ExecutableQuery`, `TablesWithColumn`, and `JoinableChain` — the workarounds for hypequery's typing gaps included, since those gaps belong to the library and not to whichever endpoint hit them first. `WarehouseNumber` sits in `lib/numbers.ts` beside `toNumber`, the reader for it.

## Shared code outside modules

`src/lib/` holds what is not tied to any one feature — the route registrar, pagination and nullability contracts, and the normalizers for the shapes warehouse rows arrive in (`strings.ts`, `numbers.ts`, `dates.ts`).

A helper belongs there once it encodes a property of the platform or the data source rather than of a domain: `emptyToNull` is shared because every ClickHouse `String` column uses `''` for "no value". Domain rules stay in their module — how a sport string resolves to a competitive level is an athletes question, so it lives in `modules/athletes/sport/classification.ts`. The split runs by knowledge, not by how generic the code looks: `toAge` is in `lib/dates.ts` because counting whole years between two dates needs to know nothing about athletes.

A shared reader that carries a policy rather than just a format must say so in its own doc comment, because the safe default is not obvious from the name. `toPositiveCount` reports `0` as absent, which is right for a backfilled counter and wrong wherever zero is a real measurement.

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
- Build subqueries as governed builders and register them with `withCTE(alias, builder)`; `withCTE` accepts a builder, so a CTE never needs to be a hand-written SQL string. Aggregates have builder forms too (`argMax`, `max`, `groupBy`). Reserve `rawAs` for expressions the builder cannot express at all — window functions, and `argMax` over an expression rather than a column — and comment why at each use.
- Qualify every column in a query that joins: write `new_vertical.athletes_cache.name`, not `name`. An unqualified name is ambiguous the moment any joined source shares it, and ClickHouse fails the whole query with `AMBIGUOUS_IDENTIFIER` instead of choosing. A `SELECT ... AS name` alias can mask the problem in the list query while the sibling `count()` query — which has no aliases — still fails, so a passing page does not prove the filter is safe.
- The builder's `where(column, operator, value)` overload cannot type a fully-qualified column: its value inference reads the first dot as the table boundary, so `new_vertical.<table>.<column>` resolves to `never`. Use the predicate form (`where((p) => p.fn("equals", p.col(column), p.value(v)))`) for qualified comparisons.
- `leftAnyJoin` only accepts an _unqualified_ left column and only a table in the generated schema, so joining CTEs or joining on a qualified key needs a narrow structural escape hatch. Keep it in one documented place, and verify the result against real ClickHouse — these mistakes typecheck.

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

# Architecture

The shape of the system, and the rules that must survive every change.

Detailed contracts live alongside this file and are the operational
source of truth for their own subject:

- `docs/architecture/access-and-feature-gating.md` — how product
  availability, permissions, routes, and vertical identity relate.
- `docs/contracts/access-context.md` — the frontend access contract.
- `docs/contracts/vertical-config.md` — the vertical identity contract.

Invariants below are marked with `CRITICAL` or `MUST NOT`. The harness
review stage treats a violation of either as a blocking finding, so
add a marked invariant only when it is genuinely non-negotiable.

## System overview

A Turborepo + pnpm workspace serving several verticals (music, sports,
creators) from one codebase. The active vertical is resolved from the
request hostname; it changes identity, branding, theme, and
terminology, never which features exist.

```
                        hostname
                           │
                           ▼
  apps/web ──────────────────────────────► apps/api
  React 19 / Vite 8 / Mantine 9            Fastify 5 / TypeBox
  react-router, TanStack Query             @fastify/swagger
  PropelAuth (@propelauth/react)                 │
  Lingui i18n (7 locales)                        ▼
        │                                  ClickHouse
        │ @repo/api-client                 (@clickhouse/client,
        │ (generated from OpenAPI)          @hypequery/clickhouse)
        ▼
  packages/ui — shared Mantine components
```

`apps/api` publishes an OpenAPI document generated from its TypeBox
route schemas; `packages/api-client` generates its types from that
document. Both artifacts are committed, and `pnpm check:generated`
proves they match their sources.

## Stack

- **Runtime** — Node 26 (`.nvmrc`), pnpm 11, Turborepo task pipeline.
- **Frontend** — React 19, Vite 8, Mantine 9, TanStack Query,
  react-router 8, Lingui (de/en/es/fr/ja/ko/pt), PropelAuth.
- **Backend** — Fastify 5 with the TypeBox type provider, Scalar API
  reference, `fastify-plugin` for shared plugins.
- **Data** — ClickHouse via `@clickhouse/client` and typed
  `@hypequery/clickhouse` query builders.
- **Quality** — ESLint (zero warnings), Prettier, Vitest, tsc, husky +
  lint-staged, commitlint, GitHub Actions.

## Layout

- `apps/` — deployable applications (`web`, `api`).
- `packages/` — shared libraries (`ui`, `api-client`, `eslint-config`,
  `typescript-config`, `lingui-config`).
- `apps/api/src/modules/<entity>/` — one directory per entity
  (artists, athletes, auth), each owning its routes, query builders,
  mappers, and schemas.
- `apps/web/src/pages/<vertical>/` — page trees per vertical, with
  matching locale catalogs under `apps/web/src/locales/<vertical>/`.

## Invariants

### Authorization

CRITICAL: the API is the final authorization boundary. Frontend gating
exists for user experience only, and a route that is hidden in the UI
MUST still be refused by the API for an account that lacks access.

The API MUST NOT trust roles, products, or permissions supplied by the
browser. They are resolved server-side from AuthService.

Product authorization code MUST NOT reference Stripe plan names.
Product code asks whether an account holds a stable permission such as
`exports.create`; plan packaging is not a product-code concern.

A new permission MUST NOT be introduced unless access genuinely differs
by plan, role, seat, security boundary, override, or API scope.
Ordinary UI features are not permissions.

### Vertical configuration

`VerticalConfig` defines hostname, product identity, branding, theme
inputs, and terminology only. It MUST NOT contain feature inventories,
route inventories, entitlements, Stripe plan mappings, or paid-feature
flags.

Feature availability MUST NOT be duplicated across `VerticalConfig` and
`AccessContext`. Code defines what exists; AuthService defines what the
account may reach.

### Workspace boundaries

Applications MUST NOT import internal files from other applications.
Packages MUST NOT import from applications. Cross-workspace access goes
through declared package exports only.

Packages MUST NOT add a module whose only purpose is re-exporting other
modules. Each export is declared as a `package.json` subpath pointing at
the module that defines it — `@repo/ui` maps one subpath per component —
and consumers import that subpath directly. A package entry point that
defines its own behaviour is not a barrel: `@repo/api-client`'s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### Generated artifacts

CRITICAL: generated files are never edited by hand. `apps/api/openapi.generated.json`,
`packages/api-client/src/schema.generated.ts`, and
`apps/api/src/db/clickhouse/schema.generated.ts` are outputs. Change
the canonical source, run the generator, commit the result.

A change that alters an API contract MUST regenerate the client in the
same commit — `pnpm check:generated` fails otherwise.

### Internationalization

Every user-facing string in `apps/web` goes through Lingui. A new
string MUST be extracted and translated across all seven locales
before it can be committed; the pre-commit hook runs
`lingui compile --strict` and refuses untranslated messages.

### Data access

CRITICAL: ClickHouse query structure is composed with the hypequery
builder — `.table()`, `.withCTE()`, `.where()`, joins, ordering. SQL
statements MUST NOT be hand-written as strings and MUST NOT be
assembled by interpolation. `rawAs<T, "alias">("<expr>", "alias")` is
the one permitted escape hatch, and only for a **scalar expression**
inside a builder chain (an aggregate, a cast, arithmetic) — never for
a `FROM`, `JOIN`, `WHERE`, or a whole query.

The raw `@clickhouse/client` is confined to
`apps/api/src/db/clickhouse/`. Module code MUST NOT import it. ESLint
enforces both of these rules in `apps/api/src/modules/**`, so they fail
at lint time rather than review time.

Query-builder limitations and their escape hatches belong to the
database layer, not to whichever feature hit them first. A feature MUST
NOT declare its own builder interface or cast around the builder;
`apps/api/AGENTS.md` names where those live.

A deduplicated (`Replacing*`) table MUST NOT be read without a
correctness guarantee. Read it through a CTE that applies `FINAL` — a
join target cannot carry `FINAL` — and when its sorting key differs
from the join key, reduce it to one row per join key explicitly.
Neither defect is visible in current row counts; both are wrong on the
first duplicate row.

Secrets MUST NOT be committed or printed. Production data MUST NOT be
modified, and production migrations MUST NOT be run, from a
development session or an agent run.

### Types are derived, never restated

CRITICAL: a type that describes an API request or response MUST be
derived from the generated artifact, not hand-written. On the web side
that means `paths` from `@repo/api-client`; on the API side, TypeBox
schemas for contracts and `db/clickhouse/schema.generated.ts` for row
shapes. Narrow with `Pick`, `NonNullable`, and indexed access rather
than retyping fields.

Hand-write a type only for a concept that exists solely in the
consumer — component props, a UI display mode, column configuration. A
restated type does not fail when the contract changes; it silently
disagrees with it.

Where a hand-written type is _placed_ is a workspace convention, not a
cross-cutting invariant: see the nested `AGENTS.md`.

### File and folder layout

Two rules hold everywhere. Code specific to one route or one page lives
with it, and is promoted only when a second consumer appears —
anticipated reuse is not a trigger. And a module is named for the
responsibility its exports serve: a repository MUST NOT grow
`utils`/`helpers`/`common`/`shared` buckets, or abstract nouns that let
unrelated code accumulate under a name that excludes nothing.

The concrete layout — which base names a route folder uses, where
concern folders sit, how page folders are grouped — is a per-workspace
convention that changes as each app matures. It lives in the nested
`AGENTS.md` of the workspace being edited (`apps/api/AGENTS.md`,
`apps/web/AGENTS.md`, `packages/*/AGENTS.md`), which overrides this
file on those specifics. Do not restate it here; two copies of a layout
rule drift, and this one carries blocking authority in review.

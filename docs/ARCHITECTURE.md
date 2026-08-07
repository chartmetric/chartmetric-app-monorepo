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

Packages MUST NOT add re-export barrel files. Each export is declared
as a `package.json` subpath pointing at the module that defines it —
`@repo/ui` maps one subpath per component — and consumers import that
subpath directly.

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

ClickHouse queries live in the owning module's query builders, not in
route handlers. Route handlers validate, delegate, and map.

Secrets MUST NOT be committed or printed. Production data MUST NOT be
modified, and production migrations MUST NOT be run, from a
development session or an agent run.

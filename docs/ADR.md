# Architecture Decision Records

Append-only. One numbered entry per decision, newest last. Decisions
land here BEFORE the phase that depends on them.

The entries below record decisions the repository had already made
before the harness was introduced; they were reconstructed from the
code and existing contracts, so their dates are approximate.

## ADR-001: Access is resolved by AuthService, not by vertical config

- **Date**: 2026-07 (reconstructed)
- **Status**: accepted
- **Context**: A multi-vertical platform invites a central registry
  listing every feature per vertical and per plan. That registry has to
  be updated for every new chart, column, and page, and it drifts from
  the code immediately.
- **Decision**: Code defines what exists. AuthService resolves the
  products and permissions for the current user and account.
  VerticalConfig carries identity and presentation only. The API
  enforces; the frontend only shapes the UI.
- **Consequences**: Ordinary features ship without touching any central
  list. Permissions are reserved for durable commercial or security
  boundaries. Full detail in
  `docs/architecture/access-and-feature-gating.md`.

## ADR-002: The API contract is generated, and its client with it

- **Date**: 2026-07 (reconstructed)
- **Status**: accepted
- **Context**: Hand-written frontend types for backend routes drift
  silently and fail at runtime.
- **Decision**: Fastify routes declare TypeBox schemas; `apps/api`
  generates an OpenAPI document from them; `packages/api-client`
  generates its types from that document. Both artifacts are committed
  and verified by `pnpm check:generated`.
- **Consequences**: A contract change is a one-command regeneration and
  must land in the same commit. Generated files are never hand-edited.

## ADR-003: No re-export barrel files

- **Date**: 2026-07 (reconstructed)
- **Status**: accepted
- **Context**: Barrel `index.ts` files defeat tree-shaking, create
  import cycles, and turn every consumer into a dependent of every
  module in the package.
- **Decision**: Packages declare one `package.json` subpath export per
  public module. Consumers import the subpath directly.
- **Consequences**: Adding a public component means adding an export
  entry. Imports are longer but precise.

## ADR-004: In-repo phase harness for AI-assisted development

- **Date**: 2026-08-07
- **Status**: accepted
- **Context**: Agent-driven changes need a deterministic verifier, a
  fresh-context review, and a place for durable rules to accumulate.
  Ad-hoc prompting produces work that passes review by assertion.
- **Decision**: Vendor the `chartmetric/harness-template` phase runner
  into `scripts/`, owned in-repo rather than tracked as a dependency.
  Test-first is enforced by the runner's RED-verifier precondition
  rather than by a per-file hook; the template's `tdd_guard` was
  dropped because husky and the reviewer already cover it with fewer
  false positives.
- **Consequences**: Phases run via `python3 scripts/execute.py run <id>`
  and commit locally; pushing stays human. Python enters the repo for
  the harness only — stdlib, exercised by a step in the existing CI
  job at the 3.10 floor, and outside the Turborepo task graph. See
  `docs/HARNESS_GUIDE.md`.

## ADR-005: ClickHouse is queried through hypequery builders, never raw SQL

- **Date**: 2026-08-07 (decision predates this entry; recorded when the
  rule was harvested from recurring review findings)
- **Status**: accepted
- **Context**: Hand-written SQL strings lose the generated schema types
  that turn a column rename into a compile error, and they reintroduce
  string interpolation as an injection path. Both failure modes
  appeared in real implementation sessions before the rule existed.
- **Decision**: All ClickHouse access in `apps/api` composes queries
  with the `@hypequery/clickhouse` builder against the generated
  schema. `rawAs` is permitted only for a scalar expression inside a
  chain — an aggregate, a cast, arithmetic — never for a `FROM`,
  `JOIN`, `WHERE`, or a whole statement. Builder limitations are
  handled once in the database layer (`lib/database.ts`), not worked
  around per feature.
- **Consequences**: ESLint blocks the raw `@clickhouse/client` import
  and SQL-shaped template literals under `apps/api/src/modules/**`.
  Generated SQL still proves nothing until it executes against a real
  ClickHouse schema, so query changes are executed through the
  read-only ClickHouse MCP rather than a committed runner. Operational
  statement in the `## Learned rules` section of `AGENTS.md` and
  `apps/api/AGENTS.md`.

## ADR-006: Feature code colocates with its consumer; promotion requires a second consumer

- **Date**: 2026-08-07 (decision predates this entry; recorded when the
  rule was harvested from recurring review findings)
- **Status**: accepted
- **Context**: The rejected alternatives — organizing by technical
  layer, or hoisting helpers to shared packages on first use — produce
  central buckets (`utils`, `helpers`) that accumulate unrelated code,
  and shared abstractions with a single caller. Implementation
  sessions exhibited both directions: helpers reimplemented locally
  because no owner was findable, and code promoted to shared locations
  nothing else consumed.
- **Decision**: Code specific to one route or page lives in that route
  or page's folder and is promoted only when a second consumer
  actually appears — never in anticipation of one. Every module is
  named for the responsibility its exports serve, not for a data type
  it uses or a generic bucket name.
- **Consequences**: Adding a second consumer is the trigger to move
  code up one ownership level, in the same change. Per-workspace
  layout details (base filenames, concern folders, component
  grouping) live in each workspace's nested `AGENTS.md`, which this
  decision anchors. Operational statement in the `## Learned rules`
  section of `AGENTS.md`.

## ADR-007: An entity list route may join at request time; a denormalized cache is not required

- **Date**: 2026-08-10
- **Status**: accepted
- **Context**: The athletes list reads `new_vertical.athletes_cache`, a
  denormalized table with `name` and `image_url` already flattened in,
  built by an upstream pipeline outside this repository. The influencer
  list has no equivalent: `creator_profile_cache` carries tags,
  demographics, and handles but no name and no avatar, so those must
  come from `new_vertical.profile`. Following the athletes precedent
  would block the feature on upstream pipeline work.
- **Decision**: An entity list route may join its source tables at
  request time. The influencer list joins `creator_profile_cache` to
  `profile` through a hypequery CTE per ADR-005. A denormalized cache
  table is an optimization to reach for when a measured problem
  justifies it, not a precondition for shipping a list route.
- **Consequences**: The influencers list is the first list route in the
  repository that joins at request time; `athletes_cache` remains
  correct for athletes and is not retrofitted. Both tables are
  `Replacing*`, so both sides read through `.final()` and the join key
  is checked against each sorting key. If request-time latency becomes
  a problem, the replacement is a cache table and a superseding ADR,
  not an ad-hoc denormalization inside the route.

## ADR-008: The Lingui extraction requirement covers authored copy, not data values

- **Date**: 2026-08-10
- **Status**: accepted
- **Context**: `docs/ARCHITECTURE.md` requires every user-facing string
  in `apps/web` to be extracted and translated through Lingui. Read
  literally that also covers values returned by the API — entity names,
  handles, city names, category labels — none of which are extracted
  today, and none of which a translator could own. The influencer list
  makes the ambiguity load-bearing: it renders country names derived
  from ISO codes, and the review stage treats an invariant violation as
  a blocking finding.
- **Decision**: The Lingui requirement governs **authored UI copy** —
  strings written in this repository. **Data values** originating from
  the API or a datastore are rendered as received and are not
  extracted. Where a data value has a locale-correct presentation
  defined by CLDR, the platform's ECMA-402 APIs
  (`Intl.DisplayNames`, `Intl.NumberFormat`, `Intl.DateTimeFormat`) are
  the sanctioned mechanism, keyed on the active Lingui locale. Country
  names in the influencer list use `Intl.DisplayNames`; no dependency
  is added for data the runtime already ships.
- **Consequences**: `Intl` output is locale-correct without entering the
  catalogs, so `lingui compile --strict` stays meaningful — it fails
  only for copy a translator genuinely owns. Labels that look like copy
  but arrive as data (the ~40 ClickHouse category names) are explicitly
  out of scope for translation; making them translatable would require
  the upstream data to carry locale variants, which is a separate
  decision. This supersedes nothing; it narrows the wording of an
  existing invariant, so the Internationalization section of
  `docs/ARCHITECTURE.md` is updated to match in the same change.

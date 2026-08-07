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

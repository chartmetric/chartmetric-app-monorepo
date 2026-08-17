# Phase 01 — ClickHouse schema-drift gate

## Goal

A mechanical gate that catches live-warehouse schema drift before it 500s in
production. `apps/api/src/db/clickhouse/schema.generated.ts` is a committed
snapshot of exactly the tables the code queries; today nothing compares it to
the live warehouse, so an upstream rename or column-type change (see the
2026-08-10 `profile_snapshots_v4` incident in the phase notes) passes every
unit test and fails at request time. At the end of this phase,
`pnpm --filter api check:ch-schema-drift` connects to ClickHouse, compares the
snapshot to `system.columns`, and fails on breaking drift.

## Acceptance

- `pnpm --filter api check:ch-schema-drift` is a package script that exits
  non-zero when a table or column present in `schema.generated.ts` is missing
  from live `system.columns` or has a different type, and exits 0 when the
  snapshot matches.
- The parse and diff logic is pure, lives in
  `apps/api/src/db/clickhouse/schema-drift.ts`, and has unit tests covering:
  identical schemas → clean; changed column type → breaking; vanished column →
  breaking; vanished table → breaking; live-only added column → non-breaking
  (reported, exit 0).
- The snapshot's tables, columns, and types are parsed from
  `schema.generated.ts` itself; the new code contains no hand-maintained list
  of table or column names.
- The entry script requires the same env vars as `generate-ch-schema.mjs`
  (`CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`), exits
  non-zero with a clear message when one is missing, and never passes
  credentials via argv.
- `pnpm --filter api lint`, `pnpm --filter api typecheck`, and
  `pnpm --filter api test` all pass.

## In scope

- `apps/api/scripts/**` — the entry script `check-ch-schema-drift.mjs`
  (mirror `generate-ch-schema.mjs`: env-var handling, `new_vertical`
  database, console reporting).
- `apps/api/src/db/clickhouse/**` — the pure `schema-drift.ts` module
  (snapshot parsing + diff) and its tests alongside the existing ones under
  `src/db/clickhouse/tests/`.
- `apps/api/package.json` — the `check:ch-schema-drift` script entry, wired
  like the existing generate scripts
  (`node --env-file-if-exists=.env scripts/...`).

## Out of scope

- Do NOT modify `generate-ch-schema.mjs` or regenerate
  `schema.generated.ts` — the snapshot is this gate's input, not its output.
- Do NOT wire the check into CI, husky hooks, turbo pipelines, or
  `harness.config.json` — where it runs beyond an on-demand script is a
  separate decision.
- Do NOT touch anything under `apps/api/src/modules/**` or any other
  workspace.
- Do NOT edit `docs/BACKLOG.md`, `docs/ADR.md`, or `AGENTS.md` — backlog and
  rule harvesting happen after the phase, by the human.

## Notes / open questions

- ADR-005 (hypequery builders, never raw SQL) applies to
  `apps/api/src/modules/**`. The entry script lives in `scripts/` and may use
  `@clickhouse/client` directly (already a dependency) to read
  `system.columns` — pass the table list via bound query parameters, never by
  interpolating into SQL.
- Query shape: `SELECT table, name, type FROM system.columns WHERE database =
  {db:String} AND table IN ({tables:Array(String)})`, database
  `new_vertical`.
- The snapshot's type literals are single-line strings (the generator
  collapses hypequery's multi-line literals) — normalize whitespace before
  comparing types, and compare the full normalized string exactly
  (`Nullable(String)` ≠ `String`).
- Node runs TypeScript directly in this repo (the `dev` script executes
  `src/server.ts`), so the `.mjs` entry script can import the pure `.ts`
  module with an explicit `.ts` extension.
- Report live-only added columns (and any live tables not in the snapshot are
  simply ignored — the snapshot is scoped to tables the code references) so
  the operator knows a regen is available, but do not fail on them: only
  vanished/retyped tables and columns are breaking.
- The smoke run executes the gate against the live warehouse using local
  `.env` credentials — the same ones `generate:ch-schema` already needs.
- This is the harness's pilot phase: it deliberately runs on the config
  defaults (`max_attempts: 4`, `max_review_cycles: 2`) so the retro can judge
  those budgets (backlog item).

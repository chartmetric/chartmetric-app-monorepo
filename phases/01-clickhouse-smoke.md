# Phase 01 — Execute ClickHouse queries in a smoke suite instead of asserting their SQL

## Goal

Every ClickHouse query test in this repository today asserts the string a
hypequery builder emits. None of them executes it. That cannot catch an
ambiguous identifier, an ambiguous join key, or a `Replacing*` read
missing `FINAL` — all three pass a string assertion and fail against a
real schema. This phase adds a second vitest project that runs `*.smoke.ts`
files against real ClickHouse, and proves it by covering the existing
athletes list query. Every later query phase depends on it, because
`docs/HARNESS_GUIDE.md` requires a `smoke_cmd` on any phase that changes a
query and there is currently nothing for one to call.

## Acceptance

- `pnpm --filter api test:smoke` runs every `src/**/*.smoke.ts` case against real ClickHouse and exits 0 when all queries are accepted
- `pnpm test` does not execute any `*.smoke.ts` file, so CI stays green without ClickHouse credentials
- the smoke setup exits non-zero naming the missing variables when `CLICKHOUSE_HOST`, `CLICKHOUSE_USER` or `CLICKHOUSE_PASSWORD` is unset
- a ClickHouse server error propagates out of the smoke executor as a test failure rather than being swallowed, covered by a unit test
- `list-athletes.smoke.ts` executes the athletes list query for the unfiltered default, each supported filter, and both sort directions

## In scope

- `apps/api/vitest.smoke.config.ts` — a second vitest project whose `include` is `src/**/*.smoke.ts`.
- `apps/api/package.json` — a `test:smoke` script pointing at that config.
- `apps/api/src/db/clickhouse/clickhouse-smoke.ts` — credential resolution and the executor that runs a built query and surfaces server errors.
- `apps/api/src/db/clickhouse/tests/clickhouse-smoke.test.ts` — unit coverage for the credential guard and error propagation.
- `apps/api/src/modules/athletes/routes/list-athletes/list-athletes.smoke.ts` — the first matrix.
- `apps/api/AGENTS.md` — one short entry under the ClickHouse data-boundary rules stating that a query change ships a `*.smoke.ts` matrix.

## Out of scope

- Do not add, change, or reformat any query in `apps/api/src/modules/**`. The athletes query is exercised as it stands; if the smoke run reveals a defect in it, record it and stop rather than fixing it here.
- Do not create the influencers module or any of its files. That is phase 03.
- Do not touch `apps/api/src/lib/pagination.ts` or `packages/ui`. Those belong to phase 02.
- Do not add smoke matrices for artists or any module other than list-athletes.
- Do not wire smoke into CI (`.github/workflows/ci.yml`). CI has no ClickHouse credentials and must stay that way; the harness runs smoke locally through `smoke_cmd`.
- Do not add a `vitest.config.ts` for the default project. `apps/api` currently runs on vitest defaults, which already exclude `*.smoke.ts` because they are not `*.test.ts` — verify that rather than introducing a config to enforce it.

## Notes / open questions

- ADR-005 and the fifth entry under `## Learned rules` in `AGENTS.md` are the reason this phase exists. Read both.
- Credentials come from `apps/api/.env`, which the existing `generate:ch-schema` script reads via `node --env-file-if-exists=.env`. Use the same mechanism; never pass credentials on argv, which is visible to any local process via `ps`.
- Fail loudly on missing credentials rather than skipping. A smoke suite that silently reports success when it connected to nothing is worse than no smoke suite, because `smoke_cmd` would then pass for every future query phase.
- Assert query acceptance and row-shape, not absolute row counts. Warehouse population changes underneath the test; a case pinned to today's match rate is a flake. The guide's smoke section is explicit about this.
- `harness.config.json` sets `test_file_conventions` to `*.test.ts`/`*.test.tsx`. `*.smoke.ts` deliberately sits outside that so the default suite ignores it.

# Phase 03 — Leagues list API endpoint

## Goal

A new `leagues` module in `apps/api` exposing `GET /leagues` on both API
surfaces and `GET /leagues/filter-options` on the app surface, serving
the sports Leagues list from `new_vertical.leagues` enriched with
per-league athlete aggregates from `athletes_cache`. At the end of this
phase the generated OpenAPI snapshot and `@repo/api-client` types carry
the new contract, so the frontend phase can derive its types from
`paths` (ADR-002). The endpoint exists because the PRD entry "Leagues
list (sports vertical)" in `docs/PRD.md` needs a filterable league
catalog: name search, sport, tracked-athlete thresholds, aggregated
IG-follower thresholds, and a mega-athlete toggle.

## Acceptance

- `GET /leagues` is registered through `createApiRoutes` on both
  surfaces and appears in `openapi.generated.json` as `/app/leagues`
  and `/v1/leagues` with a new `leagues` tag (add the tag to the
  `tags` array in `src/plugins/openapi.ts`).
- Querystring contract: `limit`/`offset` from the shared pagination
  schema, `name`, `sports[]`, `minTrackedAthletes`,
  `minAggregatedIgFollowers`, `megaOnly` (league has ≥1 tracked athlete
  with ≥100M IG followers); `sortBy` is `name|sport|trackedAthletes`
  with default `name` asc and a stable `id` tiebreak.
- `GET /leagues/filter-options` is registered on the app surface only
  (present as `/app/leagues/filter-options`, absent from `/v1` in the
  snapshot) and returns the distinct sports of the leagues catalog.
- Reply row is exactly: `id`, `name`, `sport`, `leagueType`, `country`
  (normalized from `scope`; `'world'`/`'World'` → `null`), `logoUrl`,
  `countryFlagUrl` (parsed from the `metadata` JSON string),
  `keyAthletes` (top 5 by IG followers, each `{id, name}`),
  `nationalities` (distinct, sorted), `trackedAthletes`; `meta` carries
  `limit`/`offset`/`total`; empty strings become `null` in the mapper,
  never in the query.
- All ClickHouse access composes hypequery builders:
  `new_vertical.leagues` is read through a CTE that applies `.final()`;
  `athletes_cache` aggregates apply `.final()` with `is_active = 1` and
  `deleted_at IS NULL`; `rawAs` appears only for scalar aggregate
  expressions; ESLint passes with no raw SQL.
- `apps/api/src/db/clickhouse/schema.generated.ts` is regenerated and
  includes `new_vertical.leagues`; `pnpm check:generated` passes
  (OpenAPI snapshot and api-client regenerated in the same commit).
- Module tests exist and pass: `routes.test.ts` covers registration,
  surfaces, and responses through the app; colocated queries and mapper
  tests cover filters, sort mapping, key-athlete selection, and null
  normalization; `pnpm --filter api lint`, `typecheck`, and `test`
  pass.

## In scope

- `apps/api/src/modules/leagues/**` (new module, standard layout:
  `routes.ts`, `routes.test.ts`,
  `routes/list-leagues/{route,schemas,queries,mapper,types}.ts` with
  `tests/`, `routes/league-filter-options/...`)
- `apps/api/src/routes/app-surface.ts`,
  `apps/api/src/routes/v1-surface.ts` (register the module)
- `apps/api/src/plugins/openapi.ts` (the `leagues` tag only)
- `apps/api/src/db/clickhouse/schema.generated.ts`,
  `apps/api/openapi.generated.json`,
  `packages/api-client/src/schema.generated.ts` (generated outputs,
  via their generators only)

## Out of scope

- Any frontend change (phases 04 and 05).
- league_rankings_snapshots, team counts, seasons — the mock dropped
  them; do not read that table.
- Displayed reach values: the summed IG-follower aggregate is a filter
  threshold only and must not appear in the reply schema. TikTok
  entirely.
- Any change to the athletes module beyond nothing at all — do not
  refactor shared code into lib/ speculatively (ADR-006).
- New permissions or auth changes (ordinary feature per ADR-001).

## Notes / open questions

- PRD entry: `docs/PRD.md` → "## Leagues list (sports vertical)".
  Read it in full, including Resolved decisions.
- Data reality (verified 2026-08-18 via the ClickHouse MCP):
  `new_vertical.leagues` has 16 rows across football (11), basketball
  (NBA, WNBA), tennis (ATP Tour, WTA Tour). `league_type` values:
  club_league, pro_league, cup, tour, international. `scope` mixes
  case (`world`/`World`) and country names. `metadata` is a JSON
  string like {"current_season": 2026, "country_flag_url": "..."}.
- League-label join: `athletes_cache.football_league` and
  `.basketball_league` match `leagues.name` exactly for every catalog
  league; tennis requires `concat(tennis_tour, ' Tour')`. Keep the
  mapping in one place in the module and document it as interim.
- Follow `apps/api/AGENTS.md` exactly: qualified columns via the
  predicate form, `join_use_nulls`, CTE prerequisites ordering,
  `JoinableChain` as the only sanctioned cast, `Int64`-as-string via
  `lib/numbers.ts` readers.
- Per the learned rules: a query is unverified until executed. Run the
  full matrix (each filter alone, combined, each sort direction, the
  count/list sibling pair, empty results) through the read-only
  ClickHouse MCP; record deltas against a baseline in the phase notes.
  Do NOT add a script for this.
- Model the module on `modules/athletes` (list + filter-options pair);
  artists' `subqueries.ts` naming is the older variant — use `ctes.ts`
  style naming only if CTE builders warrant their own file.

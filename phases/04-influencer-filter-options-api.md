# Phase 04 — Serve influencer filter vocabularies from /app only

## Goal

The filter panel needs to know which categories, countries, genders and
age groups exist before a user picks one. This phase adds
`GET /app/influencers/filter-options` to supply them, on the `app` surface
only — the developer API gets the list route and its filter parameters,
not a discoverable vocabulary endpoint. That mirrors athletes, where
`/athletes/filter-options` is also `app`-only.

## Acceptance

- `GET /app/influencers/filter-options` returns category, country, gender and age-group vocabularies
- the route appears in `openapi.generated.json` under `/app/influencers/filter-options` and no `/v1/influencers/filter-options` entry exists
- categories are derived from the JSON-encoded `creator_tags` column and ordered by descending creator count
- countries are returned as ISO codes with counts, not as display names
- the age-group vocabulary contains exactly the six supported buckets and excludes the overlapping data-quality values
- every vocabulary query is scoped to `profile_type` `'creator'` so counts match the list route
- `influencer-filter-options.smoke.ts` executes each vocabulary query against real ClickHouse

## In scope

- `apps/api/src/modules/influencers/routes/influencer-filter-options/` — `route.ts` (path `/influencers/filter-options`), `schemas.ts`, `queries.ts`, `mapper.ts`, `tests/`, and the smoke matrix.
- `apps/api/src/modules/influencers/routes.ts` — register the new plugin with `surfaces: ["app"]`.
- `apps/api/src/modules/influencers/routes.test.ts` — extend to assert the surface split.
- Regenerated `openapi.generated.json` and `packages/api-client/src/schema.generated.ts`.

## Out of scope

- Do not register this route on `v1`, and do not add a `hide` flag to achieve the exclusion. The `/app` surface already marks its routes hidden through an `onRoute` hook; see `apps/api/AGENTS.md`.
- Do not try to keep this route out of `openapi.generated.json`. That committed document deliberately contains every `/app` path — the web app derives its types from them (`paths["/app/artists/filter-options"]` is already in use). Only the *runtime* `/openapi.json` hides `/app`, via the `onRoute` hook. Suppressing it from the committed artifact would break client generation.
- Do not change the list route's schemas, queries, or mapper.
- Do not map ISO country codes to display names, and do not add a country-name library. That is the frontend's job under ADR-008, in phase 06.
- Do not localize or rewrite the category labels. They are data values, not authored copy — ADR-008.
- Do not add subtag, language, ethnicity, or audience-tag vocabularies. Only the four filters the page ships.
- Do not touch `apps/web`.
- Do not add a caching layer, TTL, or materialized view. If a vocabulary query is slow, record the measurement in the retro rather than optimizing here.

## Notes / open questions

- The category vocabulary needs `ARRAY JOIN` over `JSONExtract(creator_tags, 'Array(String)')` to count per tag; roughly 40 distinct values exist. Compose it through the builder, not as a SQL string.
- Scope every vocabulary query the same way the list query is scoped — through the creator CTE. An unscoped `GROUP BY` over `creator_profile_cache` counts musicians, brands and athletes too, and the panel's counts would then disagree with the list.
- The gender vocabulary is small and closed (`male`, `female`, `non-binary`); prefer returning it from the query rather than hard-coding, so an unexpected value surfaces rather than being silently dropped.
- Age groups are the one vocabulary that is *not* simply "what the data contains" — the data contains twelve values and only six are legitimate. The allowed set is defined in phase 03's schema; import it rather than restating it.
- Reply shapes come from handwritten TypeBox in `schemas.ts`; the mapper's return type is annotated with the reply type so drift is a compile error.

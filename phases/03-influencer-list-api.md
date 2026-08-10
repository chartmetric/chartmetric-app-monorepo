# Phase 03 — Serve the influencer list from /app and /v1

## Goal

A new `influencers` module exposing the 155,785 creator profiles as a
filterable, sorted, paginated list on both the `app` and `v1` surfaces.
This is the first list route in the repository that joins its sources at
request time rather than reading a pre-denormalized cache table, which
ADR-007 permits and explains. At the end of this phase the contract and
the generated client exist, so the web phases have something typed to
consume.

## Acceptance

- `GET /app/influencers` and `GET /v1/influencers` return a paginated creator list with pagination meta carrying `total`
- the query reads `creator_profile_cache` and `profile` through CTEs that each apply `FINAL`, and returns only rows with `profile_type` `'creator'` and a null `deleted_at`
- the list and count queries apply the same filters, so the total always describes the filtered set
- `categories`, `countries`, `genders`, `ageGroups` and handle filters each narrow the result set, with categories matched against the JSON-encoded `creator_tags` column
- `ageGroups` accepts only the six supported buckets and rejects the overlapping data-quality values with a 400
- the default sort is `name` ascending, and `sortDirection` is honoured
- the mapper imports `emptyToNull` from `lib/strings` rather than redeclaring it, and parses `creator_tags` and `creator_subtags` into string arrays
- `list-influencers.smoke.ts` executes the default, every filter, both sort directions, the count and list pair, and empty-value rows against real ClickHouse
- `pnpm check:generated` passes with the regenerated ClickHouse schema, OpenAPI document and API client committed

## In scope

- `apps/api/src/modules/influencers/routes.ts` and `routes.test.ts`.
- `apps/api/src/modules/influencers/routes/list-influencers/` — `route.ts`, `schemas.ts`, `queries.ts`, `mapper.ts`, `tests/`, and `list-influencers.smoke.ts`.
- `apps/api/src/routes/app-surface.ts` and `v1-surface.ts` — registration.
- Regenerated `schema.generated.ts`, `openapi.generated.json`, `packages/api-client/src/schema.generated.ts`.

## Out of scope

- Do not build the filter-options endpoint. Phase 04 owns it; this route accepts filter values, it does not enumerate them.
- Do not touch `apps/web`. Phases 05 and 06 own the page.
- Do not expose `creator_ethnicity`, `creator_primary_language`, `creator_secondary_language`, `creator_contacts`, `audience_tags`, or `creator_bio`. The columns exist in the source table; the contract selects name, category, subtags, handles, country, city, gender and age group only.
- Do not add a `VIDEOS` field or any post/thumbnail data. No thumbnail column exists anywhere in `new_vertical` — see the PRD's out-of-scope section before attempting it.
- Do not add a CM Score field or a `cmScore` sort option. `cm_scores` contains zero creator rows.
- Do not add follower counts or `profile_snapshots_v4`. Coverage is ~10%.
- Do not introduce a permission. An entity list is an ordinary feature under ADR-001.
- Do not modify the athletes module, including its locally redeclared `emptyToNull`. That duplication is real but fixing it here is scope creep; note it in the retro instead.
- Do not create an `influencers_cache` table or any migration.

## Notes / open questions

- **The join.** `creator_profile_cache.profiles` is `UInt64`; `profile.id` is `UInt32`. The join key needs `accurateCastOrNull(cpc.profiles, 'UInt32')`. Verified working; the unfiltered join returns exactly 155,785 rows.
- **`FINAL` is required on both sides.** `creator_profile_cache` holds 409,455 raw rows over 354,983 unique `profiles`. A join target cannot carry `FINAL`, so read each through a CTE per ADR-005 and `apps/api/AGENTS.md`. Each table's join key is a prefix of its sorting key (`profiles`, `id`), so `FINAL` is sufficient and no `GROUP BY`/`argMax` reduction is needed — confirm this from `schema.generated.ts` rather than from row counts.
- **`new_vertical.profiles` (plural) is a 2-row abandoned stub.** The real table is `new_vertical.profile` (singular). The prototype's SQL referenced the wrong one.
- **`creator_tags`, `creator_subtags` and `person_type` are JSON-encoded `String`s**, not ClickHouse `Array`s — e.g. `["Music", "News & Politics"]`. Filter with `hasAny(JSONExtract(creator_tags, 'Array(String)'), [...])` composed through the builder's `predicate.fn` helpers, the way the athletes name filter composes `positionCaseInsensitiveUTF8`. This is not a `rawAs` case and must not become one.
- **The six supported age buckets** are `18-`, `18-24`, `25-34`, `35-44`, `45-64`, `65+`. Six further overlapping values exist in the data (`18-34`, `25-44`, `35-64`, `25-64`, `18-44`, `18-35`, 211 rows total) and are a data-quality artifact — reject them.
- **`creator_country` is a 2-letter ISO code**; `creator_gender` is lowercase `male`/`female`/`non-binary`. Do not map either to display text here — that is the frontend's job under ADR-008.
- `''` means "no value" in these columns. Normalize in the mapper, never in the query, per `apps/api/AGENTS.md`.
- Typed CTE joins in hypequery need the `Database & Ctes` schema extension and an `as unknown` cast at the builder boundary; that machinery belongs in the database layer, not in this module. See the data-access invariant in `docs/ARCHITECTURE.md`.
- The `/v1` request schema publishes the six age buckets externally as validation values. That is understood and accepted; the vocabulary *endpoint* stays `app`-only.
- `security_review: true`: the reviewer will threat-model exposing inferred gender and age-group attributes for individual creators on a public developer API. Keep the selected column set minimal and be able to justify each field.

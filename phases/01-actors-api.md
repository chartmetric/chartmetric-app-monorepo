# Phase 01 — Actors list API and generated contract

## Goal

Provide the typed, paginated actors-list contract needed by the TV & Movies frontend and developer API. The endpoint is actor-specific on both surfaces, obtains its data through governed hypequery builders, regenerates every derived contract, and introduces the repository's required read-only ClickHouse execution matrix for the new queries.

## Acceptance

- `GET /actors` is registered on both `app` and `v1` surfaces with TypeBox pagination and sorting schemas, defaulting to `instagramFollowers` descending
- the response returns normalized actor identity, profile image, Instagram handle and URL, follower count, popularity, total distinct role count, and at most two known-for acting credits plus total pagination metadata
- hypequery builders read the four approved TV tables, restrict rows to acting credits, count distinct title-kind-character roles, choose known-for credits by title popularity with a deterministic tie-breaker, and sort null follower counts last
- `ReplacingMergeTree` inputs are deduplicated according to their generated engine and sorting-key metadata, and the ClickHouse schema snapshot is regenerated rather than hand-edited
- route, query, and mapper tests cover both API surfaces, invalid query values, pagination, default and reversed sorting, null normalization, known-for ordering, and distinct role counting
- the regenerated OpenAPI and api-client artifacts publish `v1 GET /actors` while the app route remains hidden from the public document
- `apps/api` exposes a reusable read-only `test:clickhouse` command whose actors matrix executes list and count queries against real ClickHouse with safety caps and records the server version and schema snapshot used
- the endpoint follows the existing authentication model for each surface and introduces no new feature permission or Stripe-plan logic

## In scope

- `apps/api/src/modules/actors/`, using the endpoint-folder conventions in `apps/api/AGENTS.md`
- Registration in the existing app and v1 surface modules
- The TypeBox request/reply schemas, mapper, hypequery builders, and focused tests
- A reusable API ClickHouse smoke-test command/configuration and an actor query matrix
- Regenerated ClickHouse schema, OpenAPI, and API-client artifacts

## Out of scope

- Any frontend or TV vertical configuration
- Actor and title detail endpoints
- Search, filtering, user-configurable columns, other social platforms, or follower-change metrics
- New permissions, plan logic, or changes to the access architecture
- Renaming warehouse tables whose existing names include `persons`

## Notes / open questions

- The approved sources are `new_vertical.test_tv_persons`, `new_vertical.test_tv_person_socials`, `new_vertical.test_tv_credits`, and `new_vertical.test_tv_titles`.
- User-facing and API terminology is always actor/actors. A warehouse's pre-existing `persons` identifier remains only at the data boundary.
- Register this one route for both surfaces with `createApiRoutes`; `/app` stays hidden through the existing surface hook and `/v1` is generated into OpenAPI.
- Follow ADR-002 for TypeBox and generated client ownership, ADR-005 for hypequery-only access and real execution, and ADR-006 for actor-module colocation.
- Read the applicable `clickhouse-best-practices`, `fastify-best-practices`, `vitest`, and `comment-discipline` skills before editing.
- Derive database row types from the regenerated ClickHouse schema and public TypeScript types from TypeBox; do not restate generated shapes.
- Before joining each deduplicated source, compare its generated sorting key with the join key. Use a `FINAL` CTE and explicit reduction where the keys do not align.
- The live matrix must remain read-only, apply execution/scan caps, exercise the list/count sibling pair, both directions, null follower handling, pagination, and joined known-for enrichment, and print the ClickHouse version plus relevant schema metadata without printing credentials or application rows.
- No architecture decision remains open for this phase.

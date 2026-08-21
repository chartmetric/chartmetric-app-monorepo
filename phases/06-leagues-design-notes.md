# Phase 06 — leagues design-review amendments

## Goal

Apply the five data-display-integrity rules from the 2026-08-19 design
review (now in `docs/design/DESIGN_LANGUAGE.md`) to the leagues page,
and fix the phase-05 P1 by adding `sortDirection` to the leagues
contract so the sort affordances actually work. At the end: capitalized
sport labels everywhere, consistent cell typography, themed and capped
overflow tooltips, an IG-labeled reach pill group, and Athletes +
IG Reach as visible sortable columns matching the filters.

## Acceptance

- `GET /leagues` accepts `sortDirection` (`asc|desc`) and `sortBy`
  gains `igReach`; the reply row gains `igReach` (sum of tracked
  athletes' IG followers) with a schema description stating it is not
  a deduplicated audience; OpenAPI snapshot, api-client, and module
  tests updated; `pnpm --filter api lint/typecheck/test` pass.
- The leagues table shows two new right-aligned sortable columns —
  Athletes (`trackedAthletes`) and IG Reach (`igReach`,
  compact-formatted) — and the League/Competition column sorts again;
  a test clicks each sortable header and asserts `aria-sort` flips
  between ascending and descending.
- Sport labels are capitalized in every surface: the league identity
  cell and the sport filter pills render through a shared
  display-label formatter beside `getSportColor` in
  `apps/web/src/pages/sports/`, never the raw API value.
- Key Athletes and Nationalities cells share one text size; the
  nationalities overflow tooltip is a themed Mantine surface capped at
  10 items with a localized ellipsis line stating how many more exist,
  and a test asserts the cap.
- The REACH pill group is labeled IG Reach, and the IG Reach column
  header carries a tooltip defining the aggregation; all new or
  changed strings go through Lingui and are translated in all 7
  locales.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` pass;
  `pnpm generate:api-client` artifacts are regenerated in this change.

## In scope

- `apps/api/src/modules/leagues/**` (schemas, queries, mapper, tests)
- `apps/api/openapi.generated.json`,
  `packages/api-client/src/schema.generated.ts` (via generators)
- `apps/web/src/pages/sports/**` (leagues page; the shared label
  formatter beside `sport-colors.ts`; athletes page only if the
  formatter replaces a raw-value render there too)
- `apps/web/src/locales/sports/**`, `apps/web/src/locales/common/**`

## Out of scope

- New filters or filter thresholds — labels and columns only.
- Reworking the athletes page beyond adopting the shared label
  formatter where it renders the same raw values.
- The backlog items from the phase-05 retro not named here
  (debouncing, skeleton promotion, error-state alignment).
- schema drift outside the leagues contract.

## Notes / open questions

- Read `docs/design/DESIGN_LANGUAGE.md` "Data display integrity" first
  — the five rules there are the intent behind every criterion.
- `sortDirection`: model on athletes (`ASCENDING_FIRST` set, no schema
  default, per-column resolution). asc-first: `name`, `sport`;
  desc-first: `trackedAthletes`, `igReach`. Stable `id` tiebreak stays.
- The igReach aggregate already exists query-side for the REACH
  threshold filter — expose it in the SELECT and reply rather than
  recomputing it.
- IG Reach column tooltip copy: "Sum of tracked athletes' Instagram
  followers — not a deduplicated audience."
- Learned rule applies verbatim: a sortable header's test must click
  it and assert `aria-sort` changed; rest-state assertions pass on
  inert controls.
- The tooltip cap follows the "+N" precedent but ends with an ellipsis
  line ("…and N more") rather than enumerating the full set.
- Athletes/IG Reach column numbers format through
  `useListFormatters().compact`; keep the resolved options explicit
  (see the formatter-consolidation learned rule).
- SQL execution against real ClickHouse happens after the phase via
  the driver session's read-only MCP (writers have no MCP access).

## Verification log (2026-08-19, live API against service `vert`)

Executed after commit by the driver session through the running
`apps/api` server (the builder's own SQL, end to end). No request
errored; igReach values matched independent MCP aggregates exactly.

| Request | total | top rows (igReach) |
| --- | --- | --- |
| sortBy=igReach (defaults desc) | 16 | La Liga (992,077,454), MLS, Premier League |
| sortBy=igReach&sortDirection=asc | 16 | FIFA World Ranking (0), NWSL Women (0), UEFA Europa League (0) |
| sortBy=trackedAthletes desc | 16 | NBA, ATP Tour, WTA Tour |
| sortBy=name desc | 16 | WTA Tour, WNBA, UEFA Europa League |
| sortBy=sport asc | 16 | NBA, WNBA, Ligue 1 (id tiebreak inside sport) |
| minAggregatedIgFollowers=100M | 7 | La Liga, MLS, Premier League |
| megaOnly=true | 3 | La Liga, MLS, NBA |
| sports=tennis | 2 | ATP Tour, WTA Tour |
| name=liga | 3 | La Liga, Bundesliga, Primeira Liga |
| minTrackedAthletes=100&megaOnly=true | 1 | NBA |

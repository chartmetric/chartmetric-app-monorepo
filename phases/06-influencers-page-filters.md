# Phase 06 — Wire the influencer filter panel to the list query

## Goal

The last phase of the PRD entry: category, country, gender, age-group and
handle-search filters on the influencers page, populated from
`/app/influencer-filter-options` and applied through the list route's
query parameters. Behaviour follows the athletes page, because the two
pages are the same kind of screen and the frontend workflow treats an
unjustified difference between them as a defect.

## Acceptance

- the page renders category, country, gender and age-group filters populated from the filter-options route
- a handle search input filters the list
- applying a filter resets the offset to zero and refetches, and the result count reflects the filtered total
- country filter options display locale-correct names while sending ISO codes to the API
- the age-group filter offers only the six supported buckets
- a filter-options request failure degrades to a dismissible warning without breaking the list
- filter state and controls follow the athletes page conventions and reuse the existing `@repo/ui` filter exports
- new strings are extracted and translated across all seven locales so `lingui compile --strict` passes

## In scope

- `apps/web/src/pages/creators/influencers/influencer-filter-options-query.ts`.
- `apps/web/src/pages/creators/influencers/components/InfluencerFilters.tsx`.
- Filter state, named for the values it represents.
- `InfluencersPage.tsx` — wiring filters into the query and resetting pagination on change.
- `apps/web/src/pages/creators/influencers/components/InfluencerFilters.test.tsx` — covering filter application, offset reset, and the options-failure path. The phase verifier filters on `InfluencerFilters`, so this filename is load-bearing.
- `apps/web/src/locales/creators/**`.

## Out of scope

- Do not change `apps/api`. If a filter cannot be expressed against the existing contract, stop and report it rather than widening the route.
- Do not add subtag, language, ethnicity, or audience-tag filters. Four filters plus handle search is the whole scope.
- Do not add sort controls. Sorting stays at the route default.
- Do not add URL-parameter persistence, saved filters, or shareable filter links. Real features, but not this phase.
- Do not extract shared filter components into `packages/ui`. `checkbox-list-filter`, `multi-select-filter`, `range-filter` and `filter-bar` already exist; consume them.
- Do not modify `AthleteFilters` to share code with this panel. If they genuinely converge, that is a separate phase with its own review.
- Do not add an npm dependency.

## Notes / open questions

- Read `AthleteFilters.tsx` before designing this panel. Match its interaction model — how values are staged, when `onChange` fires, how exclusions are expressed — unless a difference is justified by the data. The mockup's panel groups category as chips, country as a select, gender and age as chip rows; reconcile that with the athletes conventions and note any deliberate divergence in the tests.
- The country control shows names and sends codes. Reuse the formatter module from phase 05 rather than adding a second mapping; it is now on its second consumer, which under ADR-006 is the trigger to move it up one ownership level if it is currently page-private.
- Category values are data strings from ClickHouse (`Music`, `Business & Careers`, …) and are rendered as received — ADR-008. The filter's *label* is authored copy; its *options* are not.
- Age-bucket display labels are authored copy; the underlying six values come from the API. Keep `18-` readable.
- Resetting `offset` to zero on any filter change is the behaviour athletes already implements in `replaceFilters`; the equivalent here is an acceptance criterion because forgetting it strands the user on an empty page.
- Query keys must include every value that changes the returned data, per `apps/web/AGENTS.md`.
- Mantine dropdowns self-hide under jsdom — render with `MantineProvider env="test"` in tests that open one.
- No `smoke_cmd`: no ClickHouse query changes in this phase.

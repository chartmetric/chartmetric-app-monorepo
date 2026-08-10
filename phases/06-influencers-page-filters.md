# Phase 06 — Wire the influencer filter panel to the list query

## Goal

The last phase of the PRD entry: category, country, gender, age-group and
handle-search filters on the influencers page, populated from
`/app/influencers/filter-options` and applied through the list route's
query parameters. The interaction model follows the **artists** page — an
inline filter bar plus a drawer, over draft state with an explicit
apply lifecycle — because that is what the mockup shows and what
`apps/web/AGENTS.md` describes.

## Acceptance

- the page renders category, country, gender and age-group filters populated from the filter-options route
- a handle search input filters the list, debounced so rapid keystrokes collapse into one query
- applying a filter resets the offset to zero and refetches, and the result count reflects the filtered total
- included and excluded selections both reach the API, using the existing include/exclude query parameter pairs
- country filter options display locale-correct names while sending ISO codes to the API
- the age-group filter offers only the six supported buckets
- a filter-options request failure degrades to a dismissible warning without breaking the list
- new strings are extracted and translated across all seven locales so `lingui compile --strict` passes

## In scope

Mirror `apps/web/src/pages/music/artists/` as this page's precedent:

- `apps/web/src/pages/creators/influencers/api/filter-options.ts` — the thin loader.
- `apps/web/src/pages/creators/influencers/components/filters/InfluencerFilters.tsx` — the inline bar.
- `apps/web/src/pages/creators/influencers/components/filters/InfluencerFiltersDrawer.tsx` — the drawer the mockup's Filters button opens.
- `apps/web/src/pages/creators/influencers/utils/influencer-filter-draft.ts` — the draft shape, a `createFilterDraft()` factory, and a `toFilterQuery(draft)` mapping to query params, exactly as `artist-filter-draft.ts` does.
- `types.ts` — extend with the filter and filter-options types derived from `paths`.
- `InfluencersPage.tsx` — wiring filters into the query and resetting pagination on change.
- `apps/web/src/pages/creators/influencers/tests/InfluencersPage.filters.test.tsx` — covering filter application, include/exclude, debounce, offset reset, and the options-failure path. The phase verifier filters on `InfluencersPage.filters`, so this filename is load-bearing.
- `apps/web/src/locales/creators/**`.

## Out of scope

- Do not change `apps/api`. The include/exclude parameter pairs land in phase 03; if a filter cannot be expressed against that contract, stop and report it rather than widening the route.
- Do not add subtag, language, ethnicity, or audience-tag filters. Four filters plus handle search is the whole scope.
- Do not add range filters. `@repo/ui/range-filter` exists and artists uses it for follower counts, but influencers has no numeric field to filter on — follower data covers ~10% of creators and is out of scope per the PRD.
- Do not add sort controls or a column picker.
- Do not add URL-parameter persistence, saved filters, or shareable filter links. Real features, but not this phase.
- Do not extract shared filter components into `packages/ui`. `filter-bar`, `multi-select-filter` and `checkbox-list-filter` already exist; consume them.
- Do not modify `ArtistFilters`, `ArtistFiltersDrawer`, `artist-filter-draft.ts`, or `AthleteFilters` to share code with this panel. If they genuinely converge, that is a separate phase with its own review.
- Do not add an npm dependency.

## Notes / open questions

- **Read `ArtistFilters.tsx`, `ArtistFiltersDrawer.tsx` and `utils/artist-filter-draft.ts` before designing anything.** They establish the whole model: `FilterBar` for the inline row, `MultiSelectFilter` for categorical include/exclude, `CheckboxListFilter` inside the drawer, a `draft` object staged separately from the applied query, and a `toFilterQuery` function that only emits parameters the user actually set.
- **`draft` is the correct word here**, and only here. `apps/web/AGENTS.md` reserves it for state with an explicit apply/discard lifecycle — which is exactly what a drawer with an Apply button is. Do not name ordinary controlled state `draft`.
- `@repo/ui/multi-select-filter` exposes `MultiSelectFilterValue` as `{included, excluded}` and an `emptyMultiSelectValue()` factory. That shape is why phase 03 ships include/exclude pairs; use both halves.
- The country control shows names and sends codes. Reuse the formatter module from phase 05 rather than adding a second mapping; it is now on its second consumer, which under ADR-006 is the trigger to move it up one ownership level if it is currently page-private.
- Category values are data strings from ClickHouse (`Music`, `Business & Careers`, …) and are rendered as received — ADR-008. The filter's *label* is authored copy; its *options* are not.
- Age-bucket display labels are authored copy; the underlying six values come from the API. Keep `18-` readable.
- Resetting `offset` to zero on any filter change is what artists and athletes both do; forgetting it strands the user on an empty page, which is why it is an acceptance criterion.
- `ArtistsPage.filters.test.tsx` is the model for the test file — it covers inline-bar selection, drawer selection, combined include/exclude, debounced search, and collapsing rapid changes into a single query. Match that coverage.
- Query keys must include every value that changes the returned data, per `apps/web/AGENTS.md`.
- Mantine dropdowns self-hide under jsdom — render with `MantineProvider env="test"` in tests that open one.
- No `smoke_cmd`: no ClickHouse query changes in this phase.

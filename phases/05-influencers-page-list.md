# Phase 05 — Render the influencer list table with pagination

## Goal

Replace the ten-line `InfluencersPage` placeholder with the real list: a
paginated table over `/app/influencers`, with the columns from the mockup,
the result count the mockup shows, and locale-correct country names.
Filters are deliberately excluded so this phase is one reviewable PR;
phase 06 adds them. The page follows the **artists** page's structure, not
the athletes one — see the notes for why.

## Acceptance

- `InfluencersPage` renders a table of influencers fetched through the generated client, replacing the placeholder title
- the table shows name, category, subtags, handles, country with city, gender and age columns
- country codes render as locale-correct names through `Intl.DisplayNames` keyed on the active Lingui locale
- the result count and page-of-N label come from the reply's pagination `total`
- loading, empty and error states are rendered, and the error state offers a retry
- all request and reply types derive from `paths` in `@repo/api-client` with no hand-written response types
- new strings are extracted and translated across all seven locales so `lingui compile --strict` passes
- the table scrolls within its own container at mobile widths without the page scrolling horizontally

## In scope

Follow the file layout of `apps/web/src/pages/music/artists/`:

- `apps/web/src/pages/creators/influencers/InfluencersPage.tsx` — the composer, replacing the placeholder.
- `apps/web/src/pages/creators/influencers/types.ts` — every derived type (`InfluencerListQuery`, `InfluencerListReply`, `Influencer`, `InfluencerSortBy`, …) pulled from `paths`, mirroring `artists/types.ts`.
- `apps/web/src/pages/creators/influencers/api/influencer-list.ts` — the thin loader.
- `apps/web/src/pages/creators/influencers/constants.ts` — page size and column configuration.
- `apps/web/src/pages/creators/influencers/components/InfluencersTable.tsx`.
- `apps/web/src/pages/creators/influencers/components/InfluencersPageStates.tsx` — loading, empty and error states, as `ArtistsPageStates.tsx` does.
- `apps/web/src/pages/creators/influencers/components/InfluencerIdentity.tsx` — the name cell with its initial-letter avatar, as `ArtistIdentity.tsx` does.
- A module owning ISO-code-to-display-name formatting, named for that responsibility.
- `apps/web/src/pages/creators/influencers/tests/InfluencersPage.test.tsx` and `influencers-page.test.helpers.tsx`.
- `apps/web/src/locales/creators/**` — extracted and translated catalogs for all seven locales.

## Out of scope

- Do not build the filter panel, the filter drawer, filter state, or any filter control. Phase 06 owns all of it. This page may fetch with defaults only.
- Do not add sort controls or clickable column headers. The route's default sort is the only ordering this phase ships.
- Do not add a column picker. Artists has one; whether influencers needs one is a product question nobody has asked.
- Do not add a `VIDEOS` column, video thumbnails, or placeholder gradient tiles. No thumbnail data exists — see the PRD.
- Do not add flag icons or a flag dependency.
- Do not add any npm dependency. Country names come from the platform's `Intl.DisplayNames`; ADR-008 is explicit that no package is added for data the runtime already ships.
- Do not extract anything into `packages/ui`. The needed primitives — `data-table`, `table-pagination` — already exist and are consumed as-is.
- Do not modify the artists or athletes pages, their components, or their catalogs.
- Do not modify `apps/api`.

## Notes / open questions

- **Follow artists, not athletes.** `apps/web/AGENTS.md` says to group a page's code by concern (`api/`, `filters/`, `components/`) once more than a couple of files share one. Artists does this; athletes is flat only because it has two query modules and one filter component. The influencers page ships five filters plus search, so it starts at artists' scale. Read `ArtistsPage.tsx`, `artists/types.ts`, `api/artist-list.ts` and `ArtistsPageStates.tsx` before writing anything.
- **Read `apps/web/AGENTS.md` and the `frontend-feature-workflow` skill first.** Both require auditing `@repo/ui` and the peer entities before writing presentation code. `@repo/ui` already exports `data-table`, `table-pagination`, `column-picker`, `filter-bar`, `checkbox-list-filter`, `multi-select-filter` and `range-filter`.
- `profile.image_url` is NULL for these creators, so the avatar falls back to an initial, as the mockup does. Do not fetch avatars from elsewhere.
- Category and subtag labels arrive as data and are rendered as received. They are not Lingui messages — ADR-008. Only the surrounding chrome (column headers, states, pagination labels) is authored copy.
- `Intl.DisplayNames` must be keyed on the **active Lingui locale**, not the browser default, or the page will disagree with itself. Verified correct for all seven locales on Node 26.
- Gender arrives lowercase (`male`/`female`/`non-binary`); the display label is authored copy and goes through Lingui, keyed off the data value.
- The age bucket `18-` means under 18. Give it a label a reader can parse rather than printing the raw value.
- CI enforces i18n twice: `pnpm --filter web extract` must leave no diff, and `lingui compile --strict` must find no untranslated message. Run extract and fill all seven locales before finishing, or the gate fails.
- Never call `vi.unstubAllGlobals()` in `apps/web` tests — it removes the `matchMedia` stub installed by the suite setup. Restore globals individually with `vi.stubGlobal`.
- If a test renders a Mantine popover or dropdown, wrap it in `MantineProvider env="test"`; those components self-hide under jsdom otherwise.
- No `smoke_cmd`: this phase adds no ClickHouse query and wires no cross-process orchestration. It consumes a route that phase 03 already smoke-tested.

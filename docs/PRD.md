# Product Requirements

Append-only log of feature entries, one `##` section per feature. Created
and extended by `/feature-intake`; read by `/harness` when it proposes
phases. Repository and tooling work does not appear here — that is
governed by `docs/ARCHITECTURE.md` and `docs/ADR.md`.

## Athletes page design overhaul

**Ask:** "I want to improve the design on the athletes page and as you do it I want to add documentation to help other agents make better design decisions"

**Goal:** Redesign the athletes list page — visual surface, athlete identity presentation, and page layout — using design judgment and Mantine's own style system exclusively. Capture the resulting decisions as durable, agent-executable documentation so future agents apply the same design intelligence without reconstructing it.

### A — Visual polish

1. **LoadingOverlay (bug fix):** Wrap `<DataTable>` in `<Box pos="relative">` and add `<LoadingOverlay visible={isFetching} overlayProps={{ blur: 1 }} loaderProps={{ "aria-label": … }}>` in `AthletesTable`. The `isFetching` prop is received but never rendered — this is a missing state.

2. **Table surface:** Replace `<Paper withBorder>` with `<Paper shadow="sm">` in `AthletesTable`. On a light page background `withBorder` creates a hard 1px edge that reads as a panel boundary. `shadow="sm"` achieves visual separation with lower contrast noise. Keep `radius="md"`.

3. **Level badge color semantics:** In `LevelCell`, change professional from `color="gray"` to `color="teal"`. Gray reads as inactive or absent in Mantine's semantic color system. Teal = active/established; blue (college, existing) = developmental/aspirational.

4. **Momentum indicators:** In `MomentumCell`, replace Unicode `▲ ▼ —` with FontAwesome icons (`faArrowUp`, `faArrowDown`, `faMinus` from `@fortawesome/pro-solid-svg-icons`), matching the rest of the codebase's icon language.

5. **Row count alignment:** Right-align the "Showing 1–50" text by placing it inside the `<Group justify="space-between">` that frames the pagination controls, rather than floating left above them.

### B — Richer AthleteIdentity cell

6. **Avatar ring:** `size={40}`, `radius="xl"`, `bd="1px solid var(--mantine-color-default-border)"`. The ring anchors each athlete as a discrete visual entity when scrolling data-dense rows.

7. **Two-line information hierarchy:**
   - Line 1: name (`fw={600} size="sm"`) + verification badge inline
   - Line 2: country flag prefix + sport as `<Badge variant="dot" size="xs" color="gray">` — the dot replaces dimmed text, making sport scannable in the column without the "unimportant" connotation of `c="dimmed"`.

8. **Social links:** Set icon `gap={4}` and size `xs` — reduces horizontal footprint, no behavioural change.

### C — Page-level layout

9. **Extract `AthletesHeader`:** Pull `<Title>` + `<Text c="dimmed">` into a private named sub-component `AthletesHeader` inside `AthletesPage.tsx`. Header becomes purely editorial — title and subtitle, nothing else.

10. **Controls row:** Move `<AthleteColumnPicker>` out of the header `<Group>` into a new `<Group justify="flex-end">` between `<AthleteFilters>` and `<AthleteListContent>`. Header is editorial; controls row is operational. They no longer share a line.

11. **Skeleton loading state:** Replace the centered `<Loader>` + dimmed text in `AthleteListLoading` with five `<Skeleton height={48} radius="sm" animate>` rows in a `<Stack gap={1}>`. A table-shaped skeleton communicates incoming data shape and eliminates layout shift.

### Documentation (tooling — Phase 02)

12. Create `docs/design/DESIGN_LANGUAGE.md` — the canonical design reference: color semantics table, surface hierarchy rules, categorical data display decision tree, identity cell composition hierarchy, table loading state rationale, anti-patterns.

13. Add `## Design language` section to `apps/web/AGENTS.md`: 6–8 concrete decision rules (Mantine API calls explicit), pointer to `docs/design/DESIGN_LANGUAGE.md`.

14. Add one-line pointer in `packages/ui/AGENTS.md` to `docs/design/DESIGN_LANGUAGE.md`.

15. Update `.agents/skills/web-design-guidelines/SKILL.md` to instruct agents to read `docs/design/DESIGN_LANGUAGE.md` before any UI work in `apps/web/`.

**Referenced ADRs:**

- ADR-006: `AthletesHeader` stays private to the page file until a second consumer appears.
- ADR-003: No barrel re-exports. No new `packages/ui` subpath export.

**Out of scope:**

- No API, query logic, filter, or column definition changes.
- No changes to the music/artists page.
- No new `packages/ui` exports.
- No new permissions.
- No new component library — Mantine's style system exclusively.

## Leagues list (sports vertical)

**Ask:** "We recently added design knowledge into this repo. I want to test it by creating a new feature. I want to add a Leagues list as part of the Sports vertical. This will live as a new section on the tab. which means you have to also create a tab for the atheltes list. Athletes will be part of the Library section of the left nav bar and leagues will be in the Discover section. investigate what filter posibilities we have before implementing and produce good filtering experience with relevant data for users looking to filter between these leagues" — refined by a supplied mock (Replit prototype screenshot) and follow-up decisions.

**Goal:** A filterable Leagues list at `/sports/leagues` matching the mock's information architecture, backed by a new `GET /leagues` endpoint sourced from `new_vertical.leagues` and enriched from `athletes_cache`. The left nav gains labeled sections. The mock is authoritative for information architecture and filtering behavior; visual treatment follows `docs/design/DESIGN_LANGUAGE.md` — this feature is the first ground-up test of that document.

**Resolved decisions:**

- No tab strip — left-nav sections carry the grouping ("nav sections only").
- API surface: both `/app` and `/v1`.
- Nav ships the full mock shape with not-yet-built items disabled.
- "Mega only" = league has ≥1 tracked athlete with ≥100M IG followers.
- Key Athletes = top 5 per league by IG followers; display 3 chips + "+N" overflow.
- No displayed reach metrics this run: audience deduplication is impossible with per-athlete follower counts, so summed "reach" is never shown or returned; the REACH pills act as query-side thresholds only. TikTok reach omitted entirely.

### API — new `leagues` module (`apps/api/src/modules/leagues/`)

1. `GET /leagues` on `/app` and `/v1`; new `leagues` OpenAPI tag. Standard module layout (`routes.ts`, `routes/list-leagues/{route,schemas,queries,mapper,types}.ts`, colocated tests) plus `GET /app/leagues/filter-options` (app-only) returning the distinct sports for the pill row.
2. Sources, all via hypequery builders: `new_vertical.leagues` read through a CTE with `FINAL` (ReplacingMergeTree sorted by `id`); per-league aggregates from `athletes_cache` (`FINAL`, `is_active = 1`, `deleted_at IS NULL`) grouped by derived league label — `football_league` / `basketball_league` / `tennis_tour + " Tour"` — joined to the catalog on league name (documented name-join until athlete↔league IDs exist).
3. Per-league derived data: `trackedAthletes` (count), `keyAthletes` (top 5 by IG followers: `{id, name}`), `nationalities` (distinct, sorted), plus query-only aggregates for filtering: summed IG followers (REACH thresholds) and max single-athlete IG followers (Mega).
4. Querystring: `limit`/`offset` (shared pagination schema), `name`, `sports[]`, `minTrackedAthletes` (UI: 2+/5+/10+), `minAggregatedIgFollowers` (UI: REACH 1M+/10M+/100M+), `megaOnly` (boolean). `sortBy`: `name | sport | trackedAthletes`, default `name` asc, stable `id` tiebreak.
5. Reply row: `id`, `name`, `sport`, `leagueType`, `country` (normalized from `scope`; `"world"/"World"` → `null`), `logoUrl`, `countryFlagUrl` (from `metadata` JSON), `keyAthletes`, `nationalities`, `trackedAthletes`. `meta.total` drives the header count. `''` → `null` in the mapper, never in the query.
6. Verification and generation: every filter/sort variant and the count/list sibling executed against real ClickHouse via the read-only MCP; `pnpm --filter api generate:ch-schema` rerun (first use of `new_vertical.leagues`); `pnpm generate:api-client` in the same commit (ADR-002).

### Frontend

7. Nav: extend the nav-link declaration in `apps/web/src/verticals.ts` with optional `section` (`"library" | "discover" | "tools"`) and `disabled`; `Layout.tsx` renders section headers and disabled items (non-navigating, visually muted, accessible `aria-disabled`). Sports nav per mock: Dashboard (top-level, disabled); Library → Athletes; Discover → Leagues, Teams (disabled), Games (disabled), Events (disabled); Tools → Shortlists (disabled), Compare (disabled). Music/creators links stay flat (no section). Icons per item via FontAwesome. Labels localized (common catalog).
8. New route `/sports/leagues`; page under `src/pages/sports/leagues/` mirroring the athletes page structure, reusing `@repo/ui` (`search-input`, `data-table`, `table-pagination`) and the quick-pill pattern from athletes (`PillGroup`/`Pill` precedent).
9. Header row per mock: title + live total count + inline search + pill groups — sport (single-select: All Sports / per-sport), ATHLETES (2+ / 5+ / 10+, single-select), REACH (1M+ / 10M+ / 100M+, single-select), Mega only toggle.
10. Columns per mock: `#` (ordinal from offset), League/Competition identity cell (logo `Avatar radius="sm"` + name + sport label — rendered as colored text per the design-language taxonomy rule, not a gray badge), Key Athletes (3 chips + "+N" with tooltip, following the existing `LeagueCell` overflow precedent), Nationalities (inline list + "+N" with tooltip). League column sortable asc/desc.
11. `getSportColor` promoted out of `athletes/utils/` to a shared sports-page location — its second consumer now exists (ADR-006 trigger).
12. Design-language compliance is an acceptance criterion: state-sibling Paper consistency, complete skeleton (toolbar + body + footer, CSS-var bar heights, page-size row count), active-column-only sort icon, teal hover accent, FA icons only, `miw={0}`/truncation rules in cells.
13. All strings through Lingui across all 7 locales (`sports` + `common` catalogs); TanStack Query keys `["leagues", query]`, `["league-filter-options"]`.

**Referenced ADRs:**

- ADR-001 — ordinary feature: no new permission; nav stays presentation in route/nav code.
- ADR-002 — OpenAPI snapshot + client regenerated in the same commit as the contract.
- ADR-005 — hypequery builders only; SQL proven through the ClickHouse MCP, no committed runner.
- ADR-003 — no barrel files; no new `packages/ui` exports planned.
- ADR-006 — page code colocated under `src/pages/sports/leagues/`; `getSportColor` promoted only because a second consumer now exists.

**Out of scope:** displayed reach metrics (IG or TikTok — deferred until audience dedup is possible); league detail pages; the disabled nav destinations (Dashboard, Teams, Games, Events, Shortlists, Compare) as pages; tab strip; URL/search-param state; column picker; the mock's top-bar global search (Replit prototype chrome, not this app's header); changes to the athletes page beyond the `getSportColor` promotion; new permissions; new `packages/ui` exports.

**Open questions:**

- Whether the REACH pills should survive at all given no reach number is ever displayed (current resolution: keep as filter-only).
- Exact disabled-nav presentation (tooltip "Coming soon" vs. plain muted) — implementation detail for the phase.

### Amendment — design review notes (2026-08-19)

User design review of the shipped page produced five rules (now in
`docs/design/DESIGN_LANGUAGE.md` under "Data display integrity") and a
scope change executed as phase 06:

- Sport labels capitalized everywhere (cells and pills).
- Peer-column type-scale consistency; themed tooltips; overflow
  tooltips capped — never enumerate 42 items.
- REACH pills renamed IG Reach (platform transparency).
- Filter–column parity: Athletes and IG Reach become visible, sortable
  columns. **This supersedes the earlier "no displayed reach metrics"
  resolution**: the sum is displayed, labeled as what it is (sum of
  tracked athletes' IG followers), with the definition in the column
  tooltip. Requires exposing the aggregate in the reply plus `sortBy`
  additions and a `sortDirection` param (also fixing the phase-05 P1:
  the league column's sort control was inert without it).

### Amendment 2 — prototype-parity design pass (2026-08-19)

Second user design review, executed as phase 07. Tokens verified from
the deployed prototype CSS. New rules in `docs/design/DESIGN_LANGUAGE.md`
("Theme tokens (prototype parity)"):

- Tooltips/floating surfaces follow the active color scheme (the
  shipped tooltip inverted: dark on light mode, light on dark — ruled
  never-again).
- Global density matching the prototype (tables `verticalSpacing="sm"`,
  compact toolbar/footer paddings, better row-width distribution).
- Radius scale squared to the prototype's 0.3rem base.
- Space Mono as the data face; numeric cells share peer text size,
  right-aligned, digits aligned.
- Search input inline in the page header row, never detached.
- Column order: identity left, lists middle, numeric metrics at the
  right edge (# | League | Key Athletes | Nationalities | Athletes |
  IG Reach).

## Influencer list on the Influencers page

- **Date**: 2026-08-10
- **Status**: ready for `/harness`

### Ask

> We want to add a list of influencers on the Influencers Page, similar to
> this screenshot, but following the standard filter conventions of the
> other pages (artists, athletes). The screenshot is a mockup.
>
> Attached are queries that are suggested by the prototype — please use CH
> MCP to confirm if this is actually the correct ones, and if not, find the
> correct tables.

Follow-up answers from the requester: creators only; query-time join for
now; drop the videos column; expose only the age buckets the data
supports; use a library rather than hand-rolling country names; check CM
Score coverage before using it to sort; keep the filter-options endpoint
off the developer API.

### Goal

Replace the `InfluencersPage` placeholder with a paginated, filterable
list of the 155,785 creator profiles, matching the filter conventions the
athletes page established so the two pages behave consistently.

### Requirements

**Data source** (verified against live ClickHouse, 2026-08-10)

- Influencers are `new_vertical.profile` rows with
  `profile_type = 'creator'` and `deleted_at IS NULL`, joined to
  `new_vertical.creator_profile_cache` on
  `accurateCastOrNull(creator_profile_cache.profiles, 'UInt32') = profile.id`
  — the column is `UInt64` on one side and `UInt32` on the other. The
  join yields exactly **155,785** rows.
- Both tables are `SharedReplacingMergeTree` and both MUST be read
  through a CTE applying `.final()`; `creator_profile_cache` holds
  409,455 raw rows over 354,983 unique `profiles`, so omitting it
  duplicates ~54k rows. Each table's join key is a prefix of its sorting
  key (`profiles`, `id`), so `FINAL` is sufficient and no
  `GROUP BY`/`argMax` reduction is required.
- `new_vertical.profiles` (**plural**, 2 rows) is an abandoned stub. The
  prototype's name-lookup query referenced it and is wrong.

**API** — new module `apps/api/src/modules/influencers/`

- `GET /app/influencers` and `GET /v1/influencers` — the paginated list,
  with filters supplied as query parameters.
- `GET /app/influencer-filter-options` — filter vocabularies, `app`
  surface only. The developer API exposes the list and its filter
  parameters, not a discoverable vocabulary endpoint. This matches
  athletes, where `athlete-filter-options` is also `app`-only.
- Note that the six accepted age buckets still appear in
  `openapi.json` through the `/v1/influencers` request schema, since the
  route validates against them. Withholding the vocabulary endpoint keeps
  the list undiscoverable, not the accepted values unpublished.
- Folder layout, base filenames, and the `create<Route>Queries(database)`
  factory follow `apps/api/AGENTS.md`.
- No new permission: an entity list is an ordinary feature (ADR-001).

**Filters and sorting**

- Category — `creator_tags`, a **JSON-encoded `String`** such as
  `["Music", "News & Politics"]`, not a ClickHouse `Array`. Filter with
  `hasAny(JSONExtract(creator_tags, 'Array(String)'), [...])` composed
  through the builder's `predicate.fn` helpers, as the athletes name
  filter does. ~40 distinct values.
- Country — `creator_country`, a 2-letter ISO code.
- Gender — `creator_gender`, lowercase `male` / `female` / `non-binary`.
- Age group — `creator_age_group`, restricted to the six buckets the data
  supports: `18-`, `18-24`, `25-34`, `35-44`, `45-64`, `65+`. Six further
  overlapping values (`18-34`, `25-44`, `35-64`, `25-64`, `18-44`,
  `18-35`, 211 rows total) are a data-quality artifact and MUST NOT be
  offered as filters.
- Handle search across `instagram_handle`, `tiktok_handle`,
  `youtube_handle`.
- Default sort is `name` ascending. **`cm_scores` contains no creator
  rows at all** (brand 5,969, athlete 1,887, musician 1,098), so the
  athletes default of `cmScore desc` is unavailable.
- `''` means "no value" in these columns; normalize to `null` in the
  mapper, never in the query.

**Web** — `apps/web/src/pages/creators/influencers/`

- Replace the placeholder `InfluencersPage.tsx`. Structure mirrors the
  athletes page: a list query module, a filter-options query module, and
  a `components/` folder for the table and filter panel.
- Request and response types derive from `paths` in `@repo/api-client`.
- Country codes render through `Intl.DisplayNames` keyed on the active
  Lingui locale (ADR-008), in one module owned by this page until a
  second consumer appears (ADR-006). No dependency is added.
- Columns: name, category, subtags, handles, country + city, gender, age.
- Before implementing, audit `@repo/ui` and the athletes page for
  reusable filter and table mechanics, per the
  `frontend-feature-workflow` skill. Athletes would be the second
  consumer of anything extracted, which makes extraction legitimate
  under ADR-006 rather than premature.

**Verification**

- Any phase touching the query carries a `smoke_cmd` that executes it
  against real ClickHouse — asserted SQL strings prove nothing (ADR-005).
- Re-run `pnpm --filter api generate:ch-schema` (the generator discovers
  `creator_profile_cache` by scanning `.table()` calls) and
  `pnpm generate:api-client`, committing both in the same change.

### Referenced ADRs

- **ADR-001** — an entity list is an ordinary feature, so it introduces
  no permission.
- **ADR-002** — the route's TypeBox schemas generate the OpenAPI document
  and the client; both artifacts land in the same commit.
- **ADR-003** — new `@repo/ui` exports, if any extraction happens, are
  declared as `package.json` subpaths, not a barrel.
- **ADR-005** — the join is composed with hypequery builders; no raw SQL,
  and `rawAs` only for scalar expressions.
- **ADR-006** — page-specific code stays in the page folder; the country
  formatter is promoted only on a second consumer.
- **ADR-007** — the request-time join, rather than waiting for an
  `influencers_cache`.
- **ADR-008** — country names via `Intl.DisplayNames`; ClickHouse
  category labels are data values and are not translated.

### Out of scope

- **The `VIDEOS` column.** No thumbnail data exists anywhere in
  `new_vertical`: `social_posts` (16.06M rows) has `post_url`, `caption`,
  `media_type` and engagement counts but no thumbnail or cover column,
  and neither do `tiktok_posts_cache`, `instagram_posts_cache`,
  `youtube_shorts_cache`, or `profile_youtube_videos`. The mockup's tiles
  are gradient placeholders.
- **Flag icons.** Not in the mockup; no dependency added.
- **Follower-based sorting.** `profile_snapshots_v4` has `followers` and
  `engagement_rate` but covers only ~10% of creators (15,332 TikTok,
  12,204 Instagram, 3,319 YouTube), so it would reduce the list to a 15k
  list when sorted.
- **CM Score for creators.** Requires upstream work on `cm_scores`.
- **An `influencers_cache` table.** Deferred per ADR-007.
- **Translating category names.** Data values, per ADR-008.
- **Avatars.** `profile.image_url` is NULL for these creators, so the
  table falls back to initials, as the mockup does.

### Open questions

- Whether the athletes and influencers filter panels and table shells
  should be extracted into `@repo/ui` as part of this work or in a
  follow-up. Two consumers now exist, so ADR-006 permits it; phase
  planning decides whether it belongs in the same PR.
- Follower and engagement sorting become worth revisiting if
  `profile_snapshots_v4` creator coverage rises materially above 10%.

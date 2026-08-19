# Product Requirements

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

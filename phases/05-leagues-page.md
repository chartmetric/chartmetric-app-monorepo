# Phase 05 — Leagues list page

## Goal

The sports vertical gains its second page: a Leagues list at
`/sports/leagues`, reachable from the Discover nav section, matching
the mock in the PRD entry "Leagues list (sports vertical)". It lists
the league catalog with quick-pill filtering (sport, tracked-athlete
thresholds, aggregated-reach thresholds, mega toggle), name search,
and per-league Key Athletes and Nationalities columns — all served by
the phase-03 endpoint through generated client types. This page is the
first ground-up test of `docs/design/DESIGN_LANGUAGE.md`: the mock
decides what information appears; the design language decides how it
looks.

## Acceptance

- Route `/sports/leagues` renders a `LeaguesPage` from
  `apps/web/src/pages/sports/leagues/`, and the sports vertical
  declares the Leagues nav item under the Discover section.
- Header row matches the mock: localized title with the live total
  from `meta.total`, inline `SearchInput`, and quick-pill groups —
  sport (single-select: All Sports plus each sport from
  `/app/leagues/filter-options`), ATHLETES 2+/5+/10+, REACH
  1M+/10M+/100M+, and a Mega only toggle — mapping to `sports[]`,
  `minTrackedAthletes`, `minAggregatedIgFollowers`, and `megaOnly`;
  changing any filter resets `offset` to 0.
- Table matches the mock: `#` ordinal derived from `offset`,
  League/Competition identity cell (logo `Avatar radius="sm"`, name,
  sport rendered as colored `Text` via `getSportColor` — not a
  `Badge`), Key Athletes as 3 chips plus a "+N" overflow with a
  tooltip listing the rest, Nationalities as an inline list plus "+N"
  with tooltip; the league column is sortable with the directional
  icon on the active column only, in the single direction the contract
  allows — `GET /app/leagues` exposes `sortBy` but no `sortDirection`,
  and `list-leagues/queries.ts` fixes `name`/`sport` ascending and
  `trackedAthletes` descending server-side, so the page mirrors that
  fixed per-column direction instead of offering a toggle the API
  cannot serve.
- All request/response types derive from `@repo/api-client` `paths`
  (no hand-written API types); TanStack Query keys are
  `["leagues", query]` and `["league-filter-options"]`.
- Loading, empty, error, and data states share identical Paper props;
  the skeleton mirrors toolbar, body, and footer with CSS-var bar
  heights and a row count driven by the page-size constant; the teal
  hover accent is set on the Paper wrapper.
- `getSportColor` is promoted out of
  `apps/web/src/pages/sports/athletes/utils/` to a location shared by
  both sports pages; the athletes page imports the promoted module and
  no duplicate sport-color mapping remains.
- All user-facing strings go through Lingui and are translated in all
  7 locales; behavior tests cover filter-to-query mapping, pill
  single-select behavior, and the four page states; `pnpm typecheck`,
  `pnpm test`, and `pnpm build` pass.

## In scope

- `apps/web/src/App.tsx` (one route entry)
- `apps/web/src/verticals.ts` (the Leagues nav item only)
- `apps/web/src/pages/sports/**` (new `leagues/` page tree; the
  `getSportColor` promotion and the athletes-page import update it
  forces)
- `apps/web/src/locales/sports/**`, `apps/web/src/locales/common/**`
  (extracted + translated strings)

## Out of scope

- Any `apps/api` change — the contract shipped in phase 03; if it is
  wrong, stop and report rather than adapting around it.
- Column picker, URL/search-param state, league detail pages,
  displayed reach values (PRD out-of-scope list).
- Changes to the athletes page beyond the `getSportColor` import
  swap.
- New `packages/ui` exports — reuse existing subpath exports; extract
  to `packages/ui` only if a component is genuinely two-consumer
  generic already (it will not be; ADR-006).
- The mock's top-bar global search (Replit prototype chrome).

## Notes / open questions

- Read `docs/PRD.md` → "## Leagues list (sports vertical)" in full,
  then `docs/design/DESIGN_LANGUAGE.md`, then
  `apps/web/AGENTS.md` — this page is scored against all three.
- Model the page tree on `src/pages/sports/athletes/` (concern
  folders: `api/`, `filters/`, `columns/`, `components/`); derive
  types exactly as `athletes/api/types.ts` does.
- Quick pills: follow the athletes `AthleteQuickFilters` precedent
  (`Pill`, `PillGroup`); ATHLETES/REACH groups are single-select
  threshold pills (a second click clears), not multi-select.
- Key Athletes chips are display-only text chips; the overflow
  affordance follows the existing `LeagueCell` "+N more" tooltip
  precedent on the athletes page.
- Identity cell: organisation avatar rules from the design language
  (`radius="sm"`, 1px default-border ring, `miw={0}` truncation).
- PRD item 10 says "League column sortable asc/desc"; the phase-03
  contract cannot serve that (no `sortDirection`). Acceptance is
  amended to the fixed per-column direction; adding `sortDirection` to
  `GET /app/leagues` is a follow-up phase, not a change to make here.
- The screenshot state in the PRD shows ATHLETES 10+ active (12 of 16
  leagues); the default page state is unfiltered (all 16, name asc).
- Lingui: strings under `src/pages/sports/leagues/` land in the
  existing sports catalog; run extract, translate all 7 locales; the
  athletes catalog currently carries two stale entries that extract
  --clean will drop — that is expected and fine.

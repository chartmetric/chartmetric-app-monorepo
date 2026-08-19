# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

### From 04-nav-sections retro (2026-08-19)

- P2: `verticals.ts` now declares six paths with no route, duplicating
  the router's catalog; drive nav visibility from route metadata as
  `apps/web/AGENTS.md` asks, once the real routes land in phase 05+.
- P3: Disabled nav items offer no reason for being inert, and Mantine's
  `opacity: 0.4` on white over teal.9 sits near the contrast floor;
  decide an affordance and a legible muted token together.
- P3: `VerticalNavItem` calls `useLocation()` per item while `Layout`
  already holds the location; pass the active path down if the item
  count grows.

### From 03-leagues-api retro (2026-08-19)

- P1: Replace the interim name-based league join (`football_league` /
  `basketball_league` / `concat(tennis_tour, ' Tour')` against
  `leagues.name`) with a real league id on `athletes_cache`: a league
  rename or a duplicate name silently zeroes or cross-counts every
  aggregate in the `/leagues` reply.
- P2: Replace `pnpm check:generated`'s `git status` grep with a
  regenerate-and-diff check that does not consult git (structurally
  unsatisfiable as a phase gate; wrong in both directions).
- P2: Add `distinctSorted(values)` to `apps/api/src/lib/filter-options.ts`
  and call it from `list-leagues/mapper.ts`, `league-filter-options/mapper.ts`,
  and `athlete-filter-options/mapper.ts`, which all reimplement
  distinct + blank-free + collated.
- P2: Add why-comments to the four bare `rawAs` uses in
  `list-leagues/queries.ts`, per `apps/api/AGENTS.md`.
- P2: Type `nationalities` as `(string | null)[]` in
  `list-leagues/types.ts`; split the filter-options cases out of
  `describe("GET /leagues")` in leagues `routes.test.ts`.
- P3: `ASCENDING_FIRST` + default-direction mapping now duplicated in
  `athletes/queries.ts` and `leagues/queries.ts`; give it one owner if
  a third list endpoint appears.
- P3: `keyAthletes` capped at 5, `nationalities` uncapped in the list
  reply; decide a cap or defer the full set to a league detail endpoint.

- P2: Add a schema-drift gate comparing `schema.generated.ts` to
  `system.columns`, failing when a column the code reads changed type
  or vanished. On 2026-08-10 an upstream `RENAME TABLE` swapped
  `profile_snapshots` for a 2,029×-larger `profile_snapshots_v4`,
  changing `verified` to `UInt8`, `snapshot_date` to `Date`, and
  `engagement_rate` to `Float64`; both list endpoints 500'd in
  production while every unit test stayed green. A rename is
  announceable and this one was announced — a silent type change is
  not, so the guard has to be mechanical. Neither `rawAs` strings nor
  hand-declared CTE types can fail at compile time, which is why
  regenerating alone would not have caught it.
- P2: Run the first pilot phase against an `apps/api` module and tune
  `max_attempts` / `max_review_cycles` from the resulting retro.
- P3: When the athlete implementation branch lands: add direct unit
  tests for its pure feature logic (filter facet flattening,
  filter-state conversion, sort defaults, column-storage validation),
  currently covered only indirectly through page tests. Preserve
  equivalence matrices in the repo rather than throwaway scripts.
- P3: Re-measure `eslint-plugin-react`'s `no-multi-comp` after #22,
  #24, and #26 merge. It would flag 13 of 34 non-test `.tsx` files
  today, including 3 in `packages/ui`, and those PRs are already
  splitting the worst offenders by hand. Cheap to adopt once it mostly
  ratifies work already done. The athlete implementation harvest added
  three more hand-applied instances of the same rule (cells, list
  states, quick filters), and `apps/web/AGENTS.md` now states it as
  layout convention — the lint rule would make it mechanical.
- P3: Decide whether `pnpm build` earns its place in the standard phase
  gate set, or whether CI-only is sufficient given the harness never
  pushes.

## Resolved

- P2: Both athlete routes reportedly instantiate their own five-minute
  club-catalog cache over the same warehouse queries. Resolved
  2026-08-17: verified against merged code — not reproducible. Both
  routes obtain the catalog through `clubCatalogFor` in
  `modules/athletes/club/catalog.ts`, which memoizes one catalog per
  ClickHouse client (WeakMap) with a promise-cached five-minute TTL,
  covered by `catalog.test.ts`. No code change needed.
- P2: Converge the agent-improvement-candidates log with the retro
  loop. Resolved 2026-08-07: the AIC log from the athlete
  implementation was harvested in full — decisions to `docs/ADR.md`
  (ADR-005, ADR-006), mechanics to `AGENTS.md` learned rules and the
  nested `AGENTS.md` files, defects here. Future evidence flows through
  phase retros' `proposed_rules`; the parallel log is retired.

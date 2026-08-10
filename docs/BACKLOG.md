# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

### From PR #53 review (2026-08-20)

- P1: Per-vertical nav configuration (user-directed follow-up PR after
  this merges): the shared shell renders sections/items declared by
  each vertical's own config module; only content differs per vertical.
  Rule already binds in DESIGN_LANGUAGE.md "Enforcement by shared
  component".
- P2: Analyze generalizing the list-endpoint filter-application pattern
  (`applyFilters` builders exist per module: artists, athletes,
  leagues) vs keeping module ownership — decide once a fourth list
  endpoint appears.
- P2: `keyAthletes`/`nationalities`-style aggregate builders may
  generalize when a second entity needs top-N-by-metric or
  distinct-collated aggregates; watch for the second consumer.
- P3: Generalize the skeleton page-size test (page-size-driven row
  count) into a shared test helper applied to every list page.
- P3: Metric column width tokens generalize when the athletes table
  adopts the leagues column system.

### From 07-prototype-parity-theme retro (2026-08-20)

- P3: Adopt `NumericCell` in the music/artists table so the design doc's
  "one NumericCell renders every such value" is true, promoting it to
  `@repo/ui` at that point (second consumer).
- P3: Visually verify the artists table's density and loading states at
  desktop and mobile widths after the inherited `verticalSpacing="sm"`
  and square radius scale (theme change reached it unverified).
- P3: `AthleteListLoading.tsx` restates the athletes table min width and
  per-column `miw` values; import them from `athletes/columns` the way
  the leagues skeleton does.

### From 06-leagues-design-notes retro (2026-08-19)

- P3: Hoist the asc/desc sortDirection TypeBox union into
  `apps/api/src/lib/pagination.ts`; `list-leagues/schemas.ts` is the
  third verbatim copy after artists and athletes.
- P3: Add distinguishing Lingui `comment:` context to msgid "Athletes"
  (leagues column header, leagues pill group, athletes table).
- P3: Filter-column parity: the leagues "Mega only" filter has no
  visible column, so its effect stays unverifiable.

### From 05-leagues-page retro (2026-08-19)

- P2: Cover the athletes filter-option count formatting change introduced
  by the `useListFormatters` dedupe (12500 now "12.5K", was "13K"), or
  restore the compact defaults (`AthleteFilters.tsx:36`).
- P2: Export `KEY_ATHLETES_MIN_WIDTH` / `NATIONALITIES_MIN_WIDTH` from
  `leagues/columns/table-columns.ts`; `LeagueListLoading.tsx` hard-codes
  the same values.
- P2: Replace the raw `sortBy` fallback in `LeaguesTable.tsx:141` with a
  translated label; derive `NationalitiesCell`'s prop from
  `League["nationalities"]`; route `OverflowCount`'s "+N" through
  `useListFormatters().plain`.
- P3: Unify list-page search debouncing on the artists 350ms
  `useDebouncedCallback` precedent; leagues and athletes fire one
  request per keystroke.
- P3: Promote `SkeletonToolbar`/`SkeletonFooter` beside the shared pills
  (leagues duplicates `AthleteListLoading`'s copies byte-for-byte);
  drop `SkeletonDataRow`'s ignored `key={index}` on its own root.
- P3: Align the athletes list error state to the design-language Paper
  state sibling (still uses `Alert`); settle the one-component-per-file
  rule against the co-declarations in `LeaguesTable.tsx` and
  `LeagueListLoading.tsx`.

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
- P2: Make the runner's commit subject survive commitlint. The
  `commit_message_format` interpolates the phase title verbatim, and
  `@commitlint/config-conventional` rejects a sentence-case subject, so
  a capitalised title fails at the commit stage after every other stage
  has passed. Downcase the title's first character when building the
  message. `docs/EXAMPLE_PHASE.md` carries the same defect: its example
  title, "Genre filter on the artists list endpoint", fails the
  identical check, so the worked example teaches the trap.
- P2: When reviewing a query that joins a `Replacing*` table, confirm
  from the schema that the join key is a prefix of the table's sorting
  key — `FINAL` cannot deduplicate for that join otherwise, and the
  defect is dormant while the table happens to hold one row per join
  key. `schema.generated.ts` records column names and types only, with
  no engine or sorting key, so this cannot be checked from the committed
  snapshot: read it through the ClickHouse MCP (`SHOW CREATE TABLE`).
  Either teach the generator to emit the sorting key, or fold the check
  into the schema-drift gate above.
- P2: `docs/EXAMPLE_PHASE.md` shows `"smoke_cmd": null`, which
  `scripts/harness/lint.py` rejects — it requires a string when the key is
  present, while `runner.py` treats an _absent_ key as the documented-skip
  path. A phase copied from the worked example fails lint before it starts.
  Either accept `null` in the linter or change the example to omit the key.
- P2: Stop recommending `pnpm check:generated` as a phase gate.
  `docs/HARNESS_GUIDE.md`'s phase-schema example lists it, and
  `docs/EXAMPLE_PHASE.md` justifies it precisely for contract-changing
  phases — but it regenerates and then fails when the artifacts differ
  from `HEAD`, so correct-but-uncommitted output still reads as a diff,
  and harness gates run before the commit. It therefore fails for
  exactly the phases the docs recommend it for. The gate should
  regenerate (`pnpm generate:api-client`) and leave verification to CI,
  where `HEAD` contains the artifacts. Fix both docs and consider
  whether the runner should reject the check outright.
- P3: Unify the CTE-schema-extension machinery. Both
  `list-influencers` and `list-artists` cast per-module
  (`InfluencerDatabase`, `MetricsDatabase`) via `as unknown`, while
  `docs/ARCHITECTURE.md` says query-builder escape hatches belong to the
  database layer. `apps/api/src/lib/database.ts` does not exist, so the
  invariant is currently unenforceable — either create the shared helper
  and move both, or amend the invariant to match reality.
- P3: Confirm that `openapi.generated.json` exposing `/app/*` paths is
  intended. It now lists `/app/influencers` alongside `/app/athletes` and
  `/app/artists`. It is required — the web client derives its types from
  those paths — but the `onRoute` `hide: true` hook's purpose reads as
  though `/app` should be absent, and the distinction between the
  committed artifact and the runtime spec is not written down anywhere.
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

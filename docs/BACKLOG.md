# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

- P1: Compose `ActorListRow` from `Pick<Test_tv_personsRecord, ...>`
  plus the alias/aggregate fields instead of restating generated
  columns by hand, so a generated column change breaks the build.
  Flagged by the phase 01 review against the type-derivation learned
  rule. Source: phase 01 retro, 2026-08-10.
- P2: Bring the actors ClickHouse matrix up to the three smoke rules
  landed from the phase 01 retro: execute every sort column (name,
  popularity, roleCount, plus their `IS NULL` companions), build the
  smoke client with `clickhouse_settings: { readonly: 2 }`, and drop
  the population-pinned non-null `instagram_followers` assertion in
  favor of the null-last ordering property. Source: phase 01 retro,
  2026-08-10.
- P2: `/actors` aggregates the full credits×titles join twice per
  request (list + count) with no push-down or cache; add a persisted
  actor summary table or cache the count. Source: phase 01 retro,
  2026-08-10.
- P2: Emit `engine` and `sorting_key` from `generate:ch-schema` so the
  FINAL/join-key rule is checkable from the committed snapshot instead
  of a live `system.tables` query, and so the smoke matrix can assert
  the join-key-is-sorting-key-prefix property mechanically. Source:
  phase 01 retro, 2026-08-10.
- P3: `/v1` has no api-key auth, scopes, or rate limits; `/actors`
  inherits that gap from the surface — close it at the surface level.
  Source: phase 01 retro, 2026-08-10.
- P3: `max_rows_to_read: 100_000_000` in the actors query settings will
  start returning 500s once `test_tv_credits` outgrows it; revisit the
  cap with a bounded pre-aggregate. Source: phase 01 retro, 2026-08-10.
- P2: Run the first pilot phase against an `apps/api` module and tune
  `max_attempts` / `max_review_cycles` from the resulting retro.
- P2: When the athlete implementation branch lands: both athlete routes
  reportedly instantiate their own five-minute club-catalog cache over
  the same warehouse queries (`createClubCatalog` in
  `list-athletes/route.ts` and `athlete-filter-options/route.ts`).
  Create the shared cache once in the module registrar and inject it.
  Not reproducible on this branch — verify against the merged code.
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

- P1: Add a `test:clickhouse` script to `apps/api` so query phases have
  a real `smoke_cmd` to point at. Resolved 2026-08-10 by phase
  01-actors-api: `apps/api` now has a reusable read-only
  `test:clickhouse` command with an actors execution matrix. The
  join-key-vs-sorting-key prefix check remains prose-only — see the
  active item on emitting `engine`/`sorting_key` from
  `generate:ch-schema`.
- P2: Converge the agent-improvement-candidates log with the retro
  loop. Resolved 2026-08-07: the AIC log from the athlete
  implementation was harvested in full — decisions to `docs/ADR.md`
  (ADR-005, ADR-006), mechanics to `AGENTS.md` learned rules and the
  nested `AGENTS.md` files, defects here. Future evidence flows through
  phase retros' `proposed_rules`; the parallel log is retired.

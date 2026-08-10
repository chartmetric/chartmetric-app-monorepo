# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

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

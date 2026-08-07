# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

- P2: Run the first pilot phase against an `apps/api` module and tune
  `max_attempts` / `max_review_cycles` from the resulting retro.
- P2: Converge the agent-improvement-candidates log with the retro
  loop. The AIC entries and a phase retro's `proposed_rules` are the
  same mechanism maintained twice; pick one home before they drift.
- P2: Add a `test:clickhouse` script to `apps/api` so query phases have
  a real `smoke_cmd` to point at. The harness now requires one for any
  phase touching a ClickHouse query, and the example phase names a
  command that does not exist yet.
- P3: Re-measure `eslint-plugin-react`'s `no-multi-comp` after #22,
  #24, and #26 merge. It would flag 13 of 34 non-test `.tsx` files
  today, including 3 in `packages/ui`, and those PRs are already
  splitting the worst offenders by hand. Cheap to adopt once it mostly
  ratifies work already done.
- P3: Decide whether `pnpm build` earns its place in the standard phase
  gate set, or whether CI-only is sufficient given the harness never
  pushes.

## Resolved

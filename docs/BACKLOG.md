# Backlog

Non-blocking followups, triaged only via `/backlog` or explicit user
reference. Priorities: P1 (blocks next phase), P2 (should do soon),
P3 (nice to have). The harness auto-appends P1 items here when a
phase's retry loop or review cycle exhausts.

## Active

- P2: Extend the smoke matrix to assert, per joined `Replacing*` table,
  that the join key is a prefix of the table's sorting key. Phase 01
  delivered the runner but its only matrix reads a single table, so this
  defect class — the one no data-driven test can catch, because it is
  dormant while a table happens to hold one row per join key — is still
  prose only. Phase 03 introduces the repository's first request-time
  join and is where it first bites.
- P2: Make the runner's commit subject survive commitlint. The
  `commit_message_format` interpolates the phase title verbatim, and
  `@commitlint/config-conventional` rejects a sentence-case subject, so
  a capitalised title fails at the commit stage after every other stage
  has passed — phase 01 hit exactly this. Downcase the title's first
  character when building the message. `docs/EXAMPLE_PHASE.md` carries
  the same defect: its example title, "Genre filter on the artists list
  endpoint", fails the identical check, so the worked example teaches
  the trap.
- P2: Stop recommending `pnpm check:generated` as a phase gate.
  `docs/HARNESS_GUIDE.md`'s phase-schema example lists it, and
  `docs/EXAMPLE_PHASE.md` justifies it precisely for contract-changing
  phases — but it regenerates and then fails when the artifacts differ
  from `HEAD`, so correct-but-uncommitted output still reads as a diff,
  and harness gates run before the commit. It therefore fails for
  exactly the phases the docs recommend it for; phase 02 hit this. The
  gate should regenerate (`pnpm generate:api-client`) and leave
  verification to CI, where `HEAD` contains the artifacts. Fix both docs
  and consider whether the runner should reject the check outright.
- P3: Give each smoke filter case one non-empty guarantee where
  warehouse data allows. Per-filter shape assertions currently only fire
  when the filter returns rows, so an empty result still passes while
  proving query acceptance alone. From phase 01's retro.
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

- P2: Converge the agent-improvement-candidates log with the retro
  loop. Resolved 2026-08-07: the AIC log from the athlete
  implementation was harvested in full — decisions to `docs/ADR.md`
  (ADR-005, ADR-006), mechanics to `AGENTS.md` learned rules and the
  nested `AGENTS.md` files, defects here. Future evidence flows through
  phase retros' `proposed_rules`; the parallel log is retired.

# Agent Improvement Candidates

This log captures implementation feedback that may later become repository guidance, an agent skill, or an iteration-harness check. An entry is evidence for a possible rule, not a permanent rule by itself.

## AIC-001: One function component per file

- Status: Implemented
- Source ask: Replace `AthleteCells.tsx` with a folder containing one file per function component so the code stays organized.
- Applied scope: `apps/web/src/pages/sports/athletes/components/AthleteCells/`
- Generalized candidate: When a React module contains multiple function components, prefer a component folder with one component per file and direct component imports.
- Boundary: Keep small non-component helpers and constants with their sole consumer; do not create a file for every function indiscriminately.
- Harness signal: Flag `.tsx` modules declaring multiple React function components, excluding tests, stories, and intentionally co-located compound-component implementations.
- Validation: Consumers import the component files directly; web type checking, focused lint, and relevant tests should pass.
- Additional evidence: The same rule was applied to the four components formerly colocated in `AthleteListStates.tsx`.
- Additional evidence: The same rule was applied to the five components formerly colocated in `AthleteQuickFilters.tsx`.

## AIC-002: Reserve draft terminology for apply/discard workflows

- Status: Implemented
- Source ask: Simplify the athlete filter state because `draft` did not communicate why the state existed.
- Applied scope: `apps/web/src/pages/sports/athletes/filters/` and its component consumers.
- Generalized candidate: Name state after the values it represents; use `draft` only when the overall interaction has an explicit apply, discard, or commit lifecycle.
- Boundary: A control may still keep an uncommitted preview value while interacting without turning the entire feature state into a draft abstraction.
- Harness signal: Flag state types or hooks containing `Draft` when most state changes immediately trigger their external side effect.
- Validation: Normal filter changes still query immediately, score-slider movement queries only at interaction end, and clearing resets both UI values and the query.

## AIC-003: Name modules for their responsibility

- Status: Implemented
- Source ask: Rename the athlete filter module because `values.ts` contains state helpers and handlers rather than values alone.
- Applied scope: `apps/web/src/pages/sports/athletes/filters/filter-state.ts`.
- Generalized candidate: Name a module after the responsibility its exports collectively serve, not after one data type used by those exports.
- Boundary: Prefer a focused responsibility name such as `filter-state` over generic buckets such as `helpers` or `utils`.
- Harness signal: Flag vague module names when their exported functions consistently describe a more specific responsibility.
- Validation: No imports reference the former `filters/values` module and existing filter behavior remains covered by tests.

## AIC-004: Keep component modules focused on composition

- Status: Implemented
- Source ask: Move filter-label and number-formatting hooks out of `AthleteFilters.tsx`.
- Applied scope: `apps/web/src/pages/sports/athletes/filters/formatters.ts`.
- Generalized candidate: Move feature-support hooks and helpers out of a component module when they represent a distinct responsibility and make the component harder to scan.
- Boundary: Keep tiny logic colocated when extraction would create an unnamed generic helper or separate code that only explains a single expression.
- Harness signal: Flag component modules with multiple top-level hooks or helpers that form a clearly named feature-local responsibility.
- Validation: The component imports the feature-local formatters and retains the same translated label and locale-aware number formatting.

## AIC-005: Group subordinate components beneath their composer

- Status: Implemented
- Source ask: Group the athlete filter UI under a filter folder with the high-level component as the main file and subordinate filter components in a nested component folder.
- Applied scope: `apps/web/src/pages/sports/athletes/components/filters/`.
- Generalized candidate: When several components exist only to implement one high-level feature component, colocate the composer at the feature-folder root and place its private building blocks in a nested `components/` directory.
- Boundary: Do not bury independently consumed page components or shared UI primitives beneath a single composer.
- Harness signal: Flag three or more sibling component modules sharing a feature prefix when only one is imported outside that sibling group.
- Validation: `AthletesPage` imports the composer, the composer imports subordinate controls, and no external consumer reaches into the nested filter components.

## Retrospective: athlete implementation

The following findings came from a separate implementation session and were cross-referenced against the commits produced on 2026-08-05. Some failures were corrected before the final commits; they remain relevant because the harness should prevent the failed iteration, not merely accept the repaired result.

### Evidence map

| Reported failure                                                                                                            | Evidence                                                                                                                                                                                                                                                   | Current disposition                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Types were declared beside implementations instead of in the owning `types.ts` files on both frontend and backend.          | `0888417` added frontend `api/types.ts`, `columns/types.ts`, and `filters/types.ts`. `4217337` subsequently documented the API type-placement convention.                                                                                                  | Corrected; prevention candidate.                                    |
| Athlete concerns were left as loose or endpoint-prefixed modules instead of grouped folders.                                | `828bae0` introduced `club/` and `sport/`; `0888417` grouped frontend code into `api/`, `columns/`, and `filters/`; `95d5973` grouped subordinate filter components beneath their composer.                                                                | Corrected; prevention candidate.                                    |
| Reusable helpers were scattered or reimplemented locally.                                                                   | `efa88b3` created API platform readers in `src/lib`; `daa0daf` added shared multi-select option builders; `abec438` added locale-aware collation; `8bf6a8e` moved list formatting to web `lib`.                                                            | Corrected in identified cases; search-first rule still needed.      |
| The implementation bypassed governed ClickHouse/query-builder conventions with raw SQL or feature-owned typing workarounds. | `efa88b3` placed `JoinableChain` and other hypequery escape hatches in `lib/database.ts`; `4217337` codified builder, qualification, and `rawAs` rules.                                                                                                    | Corrected structurally; live-query verification remains unresolved. |
| Logic and hooks were mechanically split into pairs, creating wrapper files with little independent responsibility.          | `0888417` deleted `use-athlete-filter-draft.ts` and `use-athlete-filter-facets.ts` and consolidated each concern.                                                                                                                                          | Corrected; prevention candidate.                                    |
| Frontend component modules contained several unrelated function components.                                                 | `81e2fc4`, `610d834`, and `95d5973` split cells, list states, and quick filters into owned folders.                                                                                                                                                        | Corrected; covered by AIC-001 and AIC-005.                          |
| Tests could pass while ClickHouse rejected generated SQL.                                                                   | Current endpoint tests use `stubClickhouse`; query tests assert generated SQL but do not execute it against ClickHouse. The reported `AMBIGUOUS_IDENTIFIER` failures are consistent with the qualification warning now documented in `apps/api/AGENTS.md`. | Unresolved test-layer gap.                                          |
| Two athlete routes create independent club-catalog caches.                                                                  | Both `list-athletes/route.ts` and `athlete-filter-options/route.ts` call `createClubCatalog(...)`.                                                                                                                                                         | Confirmed and unresolved.                                           |
| Pure frontend filter and storage logic lacks direct unit coverage.                                                          | No colocated unit tests exist under athlete `filters/` or `columns/`; behavior is covered indirectly through `AthletesPage` tests.                                                                                                                         | Confirmed and unresolved.                                           |
| Contract changes can leave generated OpenAPI and API-client artifacts stale.                                                | Repository instructions require regeneration and CI no-diff validation.                                                                                                                                                                                    | Guard exists; preserve as a harness gate.                           |

Runtime facts reported from the other session but not reproducible from commit history alone should be retained as external observations, not repository-proven facts: 174 of 441 clubs unmatched, 222 clubs without leagues, zero populated `ig_engagement_rate` values in the measured sample, five additional athletes found by the new last-match join, and zero observed date disagreements. A harness should measure these against a named environment and timestamp rather than encode the counts as permanent expectations.

## AIC-006: Place types by ownership

- Status: Corrected after review
- Source failure: Types were left beside implementations rather than grouped in the owning frontend or backend `types.ts` file.
- Generalized candidate: Put handwritten types and interfaces in the `types.ts` file of the smallest folder that owns their meaning; promote them when ownership broadens.
- Boundary: Generated schema-derived types and one-off library generic aliases may remain with their canonical source when repository conventions explicitly allow it.
- Harness signal: Flag handwritten `interface` and `type` declarations outside approved `types.ts` and schema files, with allowlists for inline component props and library-generic aliases.
- Validation: Check import direction so `types.ts` remains a leaf and does not depend on sibling runtime implementations.

## AIC-007: Organize by concern before adding modules

- Status: Corrected after review
- Source failure: Club, sport, API, column, filter, and sorting modules were initially left loose or named with repeated feature prefixes.
- Generalized candidate: Before adding files, identify the owning concern and use the repository's canonical folder/base-name layout; do not create a flat collection and reorganize it later.
- Boundary: A file used by only one endpoint stays in that endpoint folder until ownership actually broadens.
- Harness signal: Flag repeated feature prefixes among sibling files, cross-imports between route folders, and flat feature directories with several recognizable concerns.
- Validation: Review the proposed tree before implementation and confirm each folder name still describes every file it owns.

## AIC-008: Search before creating helpers

- Status: Corrected in identified cases
- Source failure: Counted-option mapping, plain-option mapping, name sorting, number formatting, date handling, and warehouse normalization were initially reimplemented or left near individual consumers.
- Generalized candidate: Search the repository for equivalent semantics before writing a helper; reuse or extend the existing owner when behavior is truly shared.
- Boundary: Centralize by shared knowledge, not superficial genericity. Athlete classification remains in the athlete module; locale formatting belongs in web `lib`; warehouse representation belongs in API `lib`; reusable controls belong in `packages/ui`.
- Harness signal: Search new helper bodies and names for semantic duplicates such as option mapping, collation, formatting, null normalization, and date conversion.
- Validation: Require the implementation report to name the searches performed, existing candidates found, and why the selected ownership level is correct.

## AIC-009: Avoid one-function wrapper modules

- Status: Corrected after review
- Source failure: Logic files and hooks were split mechanically, including hooks whose only purpose was wrapping one `useMemo` or `useState` call around the adjacent concern.
- Generalized candidate: Split files when responsibilities differ, not merely because one function is a hook; keep tightly coupled pure logic and its single orchestration hook together when the combined module remains focused.
- Boundary: Extract independently reusable, independently testable, or separately owned logic.
- Harness signal: Flag modules that only import one sibling function, wrap it in one React hook, and re-export the result without adding a meaningful contract.
- Validation: Ask what independent reason each file has to change, test, or be reused.

## AIC-010: Govern query-builder escape hatches centrally

- Status: Structurally corrected; runtime verification unresolved
- Source failure: A hypequery limitation was handled as athlete-specific typing and raw query logic instead of a platform-level database constraint.
- Generalized candidate: Put ORM/query-builder limitations and structural escape hatches in the database layer on first use; feature code may consume them narrowly but must not redefine them.
- Boundary: Domain-specific query composition remains in the route; only the library limitation and its safe interface move to `lib/database.ts`.
- Harness signal: Flag `unknown` casts around query builders, locally declared builder interfaces, arbitrary SQL execution, and `rawAs` uses without an allowed builder limitation.
- Validation: Require generated-schema participation, fully qualified joined columns, and live ClickHouse execution for every query using an escape hatch.
- ClickHouse rules checked: Per `query-join-use-any`, `ANY JOIN` is appropriate when enrichment needs at most one match. Per `query-join-filter-before`, source filtering and aggregation should happen before joins. Per `query-join-choose-algorithm`, join strategy must be assessed against real table sizes rather than assumed from passing unit tests.

## AIC-011: Execute query matrices against real ClickHouse

- Status: Unresolved
- Source failure: Stubbed builders and SQL-string assertions allowed syntactically invalid queries to pass all tests; reported failures included ambiguous joined columns and ambiguous join keys.
- Generalized candidate: A ClickHouse query is not verified until representative generated SQL executes against a real compatible ClickHouse schema.
- Harness signal: For list and filter-option endpoints, execute a matrix covering every filter, every sort, count/list siblings, empty values, include/exclude modes, ranges, and joined enrichment paths.
- Validation: Fail on server errors, compare count/list filter parity, and record the ClickHouse version and schema snapshot used.
- ClickHouse rules checked: Per `schema-pk-filter-on-orderby`, the matrix should reveal filters that cannot use the ORDER BY prefix. Per `query-index-skipping-indices`, non-ORDER-BY filters need real-data evaluation before adding skip indexes. Per `agent-query-safety`, harness queries need explicit execution-time and scan caps; a result `LIMIT` alone is insufficient.

## AIC-012: Test pure feature logic directly

- Status: Unresolved
- Source failure: Filter facet flattening, filter-state conversion, sort defaults, and column-storage validation are covered mainly through page tests; a throwaway equivalence script was not preserved.
- Generalized candidate: Add narrow unit tests for deterministic transformation and validation logic even when end-to-end component tests exercise it indirectly.
- Boundary: Do not duplicate UI interaction assertions in unit tests; target input/output matrices and invariants that page tests obscure.
- Harness signal: Flag exported or branch-heavy pure functions in feature logic with no colocated direct tests.
- Validation: Preserve equivalence matrices in the repository rather than relying on disposable scripts.

## AIC-013: Initialize shared caches once per owner

- Status: Unresolved
- Source failure: The list and filter-options route plugins each instantiate a five-minute club-catalog cache over the same warehouse queries.
- Generalized candidate: Create a shared cache once in the owning module registrar or plugin and inject it into route plugins.
- Boundary: Route-specific query factories remain route-owned; only the genuinely shared catalog/cache instance is promoted.
- Harness signal: Flag repeated calls to cache factories with the same dependency and lifetime configuration across sibling routes.
- Validation: Assert one catalog instance per registered athlete module and verify both routes consume it.

## AIC-014: Separate data-quality observations from stable contracts

- Status: Candidate
- Source failure: Warehouse coverage gaps and heuristics can make apparently reasonable assertions flaky or misleading.
- Generalized candidate: Document volatile data-quality measurements with environment and timestamp; test stable transformation rules independently from current warehouse population counts.
- Boundary: Stable intentional behavior, such as rank being global rather than filter-relative, should be pinned in tests; observed population counts should be monitored, not hard-coded.
- Harness signal: Reject tests that assume a particular club match rate, engagement-population rate, contiguous filtered rank, or ingestion casing distribution without a controlled fixture.
- Validation: Report data-quality metrics separately and identify upstream ownership for remediation.

## AIC-015: Gate generated contracts on every API-shape change

- Status: Existing guard to preserve
- Source failure: OpenAPI snapshots and generated client schemas can silently lag handwritten route contracts.
- Generalized candidate: Regenerate committed OpenAPI and client artifacts whenever a request or response contract changes, then require a no-diff generation check.
- Harness signal: Detect schema changes without corresponding generated-artifact changes and run the repository generation check before completion.
- Validation: `pnpm check:generated` passes with a clean worktree after regeneration.

## AIC-016: Read every ReplacingMergeTree through a subquery that can carry FINAL

- Status: Implemented
- Source failure: Six athlete reads of `ReplacingMergeTree` tables omitted `FINAL`. Three were reached only through `LEFT ANY JOIN`, where the builder cannot attach `FINAL` to the joined side at all, so the omission was structural rather than an oversight.
- Applied scope: `apps/api/src/modules/athletes/routes/list-athletes/enrichment.ts` and `apps/api/src/modules/athletes/basketball/roster.ts`; every enrichment source is now a CTE that reads its table with `.final()`.
- Generalized candidate: When a query joins a `ReplacingMergeTree` table, read it through a CTE that applies `FINAL` rather than joining the table directly. A joined table cannot carry `FINAL`, so the join can otherwise match a row that is still awaiting a merge.
- Boundary: `FINAL` is unnecessary when the query already aggregates with `argMax` over a version column that sits **outside** the sorting key — that reproduces what `FINAL` would do at lower cost. It is required when the aggregate's argument is part of the sorting key, because two versions of one row then tie.
- Harness signal: For each table read, resolve its engine from `system.tables`. Flag a `Replacing*` table read without `FINAL` unless the same subquery aggregates it with `argMax`/`argMin` over a version column that is not in `sorting_key`. Flag any `Replacing*` table appearing as a join target rather than inside a CTE.
- Validation: Assert `FROM <table> FINAL` for every enrichment CTE, and confirm output is unchanged against a merged environment — where raw and `FINAL` counts already agree, a correct fix is a no-op on current data and must be verified structurally instead.
- ClickHouse rules checked: `FINAL` is per-table-expression, so it cannot be expressed on a join target; deduplication happens only within a part until a merge completes, so unmerged duplicates are visible to any read without `FINAL`.

## AIC-017: Verify that a dedupe key matches the join key

- Status: Implemented
- Source failure: `athletes_basketball` is `ORDER BY id` while every consumer joins it on `profile_id`. `ReplacingMergeTree` therefore treats two rows for one athlete as distinct, so `FINAL` could not collapse them and `LEFT ANY JOIN` would return an arbitrary row — a stale team, league, or position, in both the list and the filter facets.
- Applied scope: `apps/api/src/modules/athletes/basketball/roster.ts`, consumed by both athlete endpoints.
- Generalized candidate: Before joining a deduplicated table, compare its sorting key with the join key. When they differ, `FINAL` is not sufficient: reduce the table to one row per join key explicitly, with `GROUP BY <join key>` and `argMax(column, <version column>)`.
- Boundary: When the sorting key already equals the join key, `FINAL` alone is enough and the extra aggregation is waste.
- Harness signal: For every join, compare the right-hand table's `sorting_key` against the join key. Flag a `Replacing*` table joined on a column that is not a prefix of its sorting key. The defect is invisible while the table happens to hold one row per join key, so flag it from the schema rather than from row counts.
- Validation: Assert one row per join key in the generated subquery (`GROUP BY <join key>` present), and measure `max(count()) GROUP BY <join key>` in the live table to record whether the risk is currently dormant or active.
- Note: This was dormant when found — 826 rows, 826 distinct `profile_id`, worst case one row per athlete — so no test on current data would have failed. It becomes live the first time an athlete gains a second row.

## AIC-018: Promote a shared query when a second endpoint needs it

- Status: Implemented
- Source failure: The corrected basketball-roster read was first written inside `list-athletes/enrichment.ts`, while `athlete-filter-options` needed the same guarantee and would have kept its own uncorrected join.
- Applied scope: `apps/api/src/modules/athletes/basketball/roster.ts`, imported by both endpoints.
- Generalized candidate: When a correctness fix applies to a table that more than one endpoint reads, promote the read to a module-level concern folder in the same change, rather than fixing one caller.
- Boundary: A query used by a single endpoint stays in that endpoint folder; promotion is triggered by a second consumer, not by anticipated reuse.
- Harness signal: Flag the same warehouse table being read with different guarantees — one caller with `FINAL` or an explicit dedupe and another without — across sibling route folders.
- Validation: Confirm no route folder imports from a sibling route folder, and that both endpoints resolve the shared column names from the promoted module.

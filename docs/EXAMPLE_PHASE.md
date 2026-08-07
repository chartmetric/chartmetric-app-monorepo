# Worked example: one complete phase

A filled JSON + md + retro trio for a hypothetical phase in this repo,
so you can see the shape before writing your own. Schema docs live in
`docs/HARNESS_GUIDE.md`; blank templates in `phases/`.

## `phases/01-artist-genres-filter.json`

```json
{
  "id": "01-artist-genres-filter",
  "title": "Genre filter on the artists list endpoint",
  "status": "pending",
  "depends_on": [],
  "acceptance": [
    "GET /artists accepts a repeatable genres query parameter validated by TypeBox",
    "the ClickHouse query filters on genre only when the parameter is present",
    "unit tests cover the query builder and the mapper for present and absent genres"
  ],
  "files": [
    "apps/api/src/modules/artists/**",
    "apps/api/openapi.generated.json",
    "packages/api-client/src/schema.generated.ts"
  ],
  "gates": [
    "pnpm typecheck",
    "pnpm test",
    "pnpm check:generated",
    "pnpm build"
  ],
  "verification_cmd": "pnpm test --filter=api -- list-artists",
  "smoke_cmd": null,
  "security_review": false,
  "notes": "Filter only. No new permission — genre is not a commercial boundary (ARCHITECTURE.md invariants)."
}
```

Why these values:

- `acceptance` has exactly 3 items and the md's `## Acceptance` section
  below has exactly 3 bullets — `lint` enforces the match.
- `verification_cmd` is narrow: the one module's tests, not `pnpm test`
  repo-wide. It must be RED before the phase starts — the runner
  refuses a fresh run whose verifier already passes.
- `files` includes both generated artifacts. A route-schema change
  regenerates them, and omitting them here would make the scope guard
  flag the regeneration as scope creep.
- `gates` include `pnpm check:generated` because this phase changes an
  API contract. They omit `pnpm lint` — the commit stage stages every
  file, so lint-staged already lints them at commit time.
- `smoke_cmd` is null: the phase ships no new orchestration, only a
  filter on an already-wired route.

## `phases/01-artist-genres-filter.md`

```markdown
# Phase 01 — Genre filter on the artists list endpoint

## Goal

The artists list endpoint can be narrowed by one or more genres, so the
web app's filter bar has a backend to call. Query-builder change plus
schema plus regenerated contract; no new route, no new permission.

## Acceptance

- GET /artists accepts a repeatable `genres` query parameter validated by TypeBox
- the ClickHouse query filters on genre only when the parameter is present
- unit tests cover the query builder and the mapper for present and absent genres

## In scope

- apps/api/src/modules/artists/routes/list-artists/ (schemas, queries, mapper)
- the regenerated OpenAPI document and api-client schema

## Out of scope

- Any frontend change — the filter UI is a separate phase.
- The athletes module, even though it has the same shape. Do NOT
  generalise across entities in this phase.
- Do NOT add a permission for genre filtering.

## Notes / open questions

- Query builders live in the module, not in the route handler
  (ARCHITECTURE.md, "Data access").
- Regenerate with `pnpm generate:api-client`; never hand-edit the
  `.generated.` files.
```

## `phases/01-artist-genres-filter.retro.json` (as the pipeline drafts it)

```json
{
  "phase_id": "01-artist-genres-filter",
  "duration_min": 31,
  "gates_fired": [
    {
      "hook": "dangerous_cmd_guard",
      "deny_count": 0,
      "allow_count": 47,
      "examples": []
    }
  ],
  "git_diff_summary": "7 files changed, 186 insertions(+), 12 deletions(-)",
  "tests_added": 5,
  "tests_passing_total": 39,
  "drafted_by": "agent",
  "smoke_run": null,
  "surprises": [
    "Writer hand-edited schema.generated.ts to make typecheck pass instead of running the generator; review flagged it against the ARCHITECTURE.md generated-artifact invariant and the fixer regenerated properly."
  ],
  "proposed_rules": [],
  "followups": [
    "P3: the athletes module needs the same filter — worth a shared query helper once a third entity appears, not before"
  ]
}
```

After the run, the human edits this file — especially `surprises` and
`proposed_rules` — then lands worthwhile rules into the
`## Learned rules` section of AGENTS.md and pushes. That editing pass
is the harness's highest-value loop; do not skip it.

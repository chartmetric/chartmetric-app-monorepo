# Phase 02 — Add an optional total to the shared pagination contract and control

## Goal

`PaginationMetaSchema` carries only `limit` and `offset`, and
`@repo/ui/table-pagination` takes `hasNextPage` with no notion of a total,
so athletes infers "is there a next page" from `rows.length === pageSize`.
The influencers list needs to show a match count and a page-of-N label,
neither of which that contract can express. This phase adds an **optional**
`total` to both, so the shape is available where a route can supply it and
nothing changes where it cannot. Optional on both sides is what keeps the
already-published `/v1/athletes` reply from breaking.

## Acceptance

- `PaginationMetaSchema` exposes an optional integer `total`, and a reply that omits it still validates
- `@repo/ui/table-pagination` accepts an optional `total` and renders a total-aware page label when one is supplied
- `TablePagination` falls back to its current `hasNextPage` behaviour and page label when no total is supplied
- `TablePagination` disables the next control on the final page when a total is supplied
- `packages/ui` tests cover the with-total and without-total rendering paths and the athletes page renders unchanged
- `pnpm check:generated` passes with the regenerated OpenAPI document and API client committed

## In scope

- `apps/api/src/lib/pagination.ts` — add the optional `total` to `PaginationMetaSchema`.
- `apps/api/src/lib/tests/pagination.test.ts` — extend for the present and absent cases.
- `packages/ui/components/data-table/TablePagination.tsx` — the optional prop and the total-aware label.
- `packages/ui/components/data-table/TablePagination.test.tsx` — new file; the component has no test today.
- `apps/api/openapi.generated.json` and `packages/api-client/src/schema.generated.ts` — regenerated output only, never hand-edited.

## Out of scope

- Do not add a count query to the athletes route, and do not populate `total` anywhere. This phase adds the capability; phase 03 is the first producer.
- Do not change `PaginationQuerySchema`, its defaults, or its bounds.
- Do not change `AthletesTable`, `AthletesPage`, or any athletes locale catalog. Athletes must keep working through the unchanged code path, which is what the last acceptance criterion checks.
- Do not refactor `DataTable`, `ColumnPicker`, or any other `@repo/ui` component.
- Do not create the influencers module or page.
- Do not add a new `@repo/ui` subpath export. `./table-pagination` already exists and is the one being extended.

## Notes / open questions

- The label shape is the caller's, not the component's: `pageLabel` is already a function prop, so pass total-awareness through it rather than hard-coding copy inside `@repo/ui`. Every user-facing string in this component comes from its consumer, and that must stay true — `packages/ui` has no Lingui catalog of its own.
- Adding an optional field to `PaginationMetaSchema` changes the emitted OpenAPI for every route that embeds it, including `/v1/athletes`. That is why `pnpm check:generated` is a gate: the regenerated artifacts must land in this commit.
- Use `Type.Integer()` for the total, per the OpenAPI note in `apps/api/AGENTS.md` — the published contract must distinguish integers from floats.
- `packages/ui` tests are colocated beside the component (see `DataTable.test.tsx`), not in a `tests/` directory. Follow that.
- Mantine dropdowns and popovers self-hide under jsdom; if a test needs one, render with `MantineProvider env="test"`. `packages/ui/vitest.setup.ts` is already wired for jsdom.

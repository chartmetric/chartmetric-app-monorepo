# Phase 02 — TV & Movies actors list

## Goal

Add TV & Movies as the fourth selectable vertical and ship its paginated `/tv/actors` list. The page consumes the generated actor API, follows established artist and athlete behavior, and reuses the shared data-table and pagination components while keeping actor-specific presentation inside the TV page.

## Acceptance

- TV & Movies is a fourth vertical labeled `for TV & Movies` with `Actors` navigation and `/tv/actors` as its home route
- the actors page consumes the generated `GET /v1/actors` contract through the existing API client and TanStack Query, with `limit`, `offset`, `sortBy`, and `sortDirection` represented in its query key
- the table reuses `@repo/ui` data-table and table-pagination and displays absolute index, Actor name, Known for, Instagram, IG Followers, Roles, and Popularity columns in that order
- actor names link to `/tv/actors/:actorId`, known-for title and character text link to `/tv/titles/:titleId`, and Instagram handles use safe external links
- IG Followers defaults to descending sorting, supports both directions, sorts through the API, and uses the existing abbreviated-number formatter while popularity uses one decimal place
- loading, refreshing, empty, error, partial-data, and total-aware pagination states are accessible and the wide table scrolls within its container at mobile widths
- all new user-facing messages are extracted and translated for `de`, `en`, `es`, `fr`, `ja`, `ko`, and `pt` with strict Lingui compilation
- behavioral tests cover vertical routing, request parameters, absolute indices across pages, sorting, links, formatting, missing data, states, and pagination

## In scope

- The `tv` entry in the existing vertical configuration and its application route
- `apps/web/src/pages/tv/actors/`, including API composition, table columns/cells, states, and the test-first target `src/pages/tv/actors/ActorsPage.test.tsx`
- The TV Lingui catalog registration and all seven locale catalogs
- Updates to application routing tests needed to cover the fourth vertical
- Reuse of `@repo/ui/data-table` and `@repo/ui/table-pagination` without duplicating their mechanics

## Out of scope

- Actor and title detail-page implementations; this phase supplies their canonical links only
- Actor or title search, filters, user-configurable columns, additional social platforms, or follower-change metrics
- A general page-shell abstraction based on this single new consumer
- Redesigning the sidebar or vertical selector beyond adding the required TV & Movies entry
- Backend, OpenAPI, or generated-client changes owned by Phase 01
- New permissions, plan logic, or authorization architecture

## Notes / open questions

- Read the `frontend-feature-workflow`, `vercel-react-best-practices`, `lingui-best-practices`, `vitest`, and `comment-discipline` skills before editing.
- The peer audit identified the music `ArtistsTable`, sports `AthletesTable`, and the shared `DataTable` and `TablePagination`. Preserve their sorting, accessibility, loading, pagination, and responsive behavior unless this PRD explicitly differs.
- Actor-specific identity and known-for cells remain in the TV page. Do not copy shared sorting or pagination mechanics.
- Derive the actor and request types from `paths` in `@repo/api-client`; do not restate the response contract.
- Display the one-based absolute row number as `offset + rowIndex + 1`.
- Render at most the two API-provided known-for credits as `<title> as <character>`, including a network suffix when present. Omit unavailable fragments cleanly and use the repository's standard empty-cell presentation.
- Safe Instagram links include `target="_blank"` and `rel="noreferrer"` or the repository's stronger established equivalent.
- Validate the rendered page at desktop and below the AppShell breakpoint, including horizontal containment, keyboard sorting, links, loading, empty, and error states. Report explicitly if real-browser validation is unavailable.
- No architecture decision remains open for this phase.

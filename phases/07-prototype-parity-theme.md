# Phase 07 — prototype-parity theme pass

## Goal

Bring the monorepo app's visual density, radius, typography, and
floating surfaces to parity with the deployed prototype, per the second
user design review (PRD Amendment 2). At the end: Space Mono data
typography with digit-aligned numeric columns, a square-leaning radius
scale, tooltips that follow the active color scheme in both modes,
compact table density on both sports tables, a leagues header composed
as one row (title + count + search + pills), and leagues columns
ordered with numeric metrics at the right edge.

## Acceptance

- The shared theme declares `fontFamilyMonospace` with `'Space Mono'`
  first (self-hosted via `@fontsource/space-mono` imported in
  `apps/web`), and every numeric metric cell in the leagues and
  athletes tables renders in the mono face at the same Mantine text
  size as neighbouring text cells, right-aligned.
- The theme radius scale is `xs 0.125rem / sm 0.1875rem / md 0.3rem /
  lg 0.375rem / xl 0.5rem`; person avatars remain circles and
  organisation avatars remain `radius="sm"`.
- Tooltip colors are set once in the shared theme so the surface
  follows the active color scheme in both light and dark modes (never
  inverts), with a test asserting the theme-level Tooltip defaults
  exist.
- Tables render `verticalSpacing="sm"` with toolbar rows `py={4}` and
  footer rows `py="xs"`, on both the leagues and athletes tables and
  their skeletons, which mirror the same paddings so no layout shift
  appears between states.
- The leagues header is one composed row — title with live count,
  inline search input, then the pill groups — with the search never
  detached in the page corner; the leagues columns are ordered
  `# | League/Competition | Key Athletes | Nationalities | Athletes |
  IG Reach` with numeric metrics at the right edge and widths
  redistributed per the design doc.
- `docs/design/DESIGN_LANGUAGE.md` numeric examples (container padding
  table, skeleton references) are updated to the shipped density
  values so the doc and code state the same tokens.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` pass; all changed or
  new strings are translated in all 7 locales.

- Driver-executed visual parity loop: the rendered leagues page is
  compared against the reference prototype screenshot in iterations —
  use of space, use of bold, use of color, and all remaining deltas —
  fixing and re-rendering until the two are visually equivalent; every
  delta found lands as a rule or token in
  `docs/design/DESIGN_LANGUAGE.md` in the same iteration (executed by
  the driver session with vision, like the MCP SQL verification —
  writer agents cannot compare screenshots).

## In scope

- `packages/ui/theme/**` (mono face, radius scale, Tooltip defaults,
  theme tests)
- `packages/ui/components/**` (DataTable density defaults, skeleton
  parity where shared)
- `apps/web/src/pages/sports/**` (leagues header composition, column
  order/widths, athletes density adoption, numeric cell typography)
- `apps/web/src/main.tsx`, `apps/web/package.json`, `pnpm-lock.yaml`
  (font dependency)
- `docs/design/DESIGN_LANGUAGE.md` (numeric token alignment only)
- `apps/web/src/locales/**` (extraction fallout)

## Out of scope

- Any API change — presentation only.
- The music/creators pages beyond what shared-theme changes apply
  automatically.
- New filters, columns beyond the specified reorder, or data changes.
- Restyling floating surfaces per call site — the theme owns it.

## Notes / open questions

- Read `docs/design/DESIGN_LANGUAGE.md` "Theme tokens (prototype
  parity)" first; tokens were verified against the prototype's
  deployed CSS (`--app-font-mono: "Space Mono"`, `--radius: 0.3rem`).
- Mantine: set `fontFamilyMonospace` in `packages/ui/theme/theme.ts`
  and render numeric cells with `ff="monospace"` (Mantine resolves it
  to the theme face) — do not hardcode the family per cell.
- Tooltip theming: `Tooltip.extend({ defaultProps/vars })` in the
  theme `components` block, using scheme-aware CSS variables (e.g.
  `var(--mantine-color-body)` background with default border and
  `var(--mantine-color-text)`) so light stays light and dark stays
  dark. Keep the focus-events default from `TOOLTIP_EVENTS` intact.
- Density: `DataTable` owns `verticalSpacing`; change its default
  rather than passing per page. Toolbar/footer paddings live in the
  page-level `TableToolbar`/`TableFooter` components on both sports
  pages and in both skeletons — move them together.
- The skeleton design rules protect you here: bar heights are CSS-var
  formulas and row counts are page-size-driven, so only the paddings
  and `verticalSpacing` need touching.
- Leagues header: the search input currently renders detached at the
  page corner; compose it into the header row per the design doc.
  Keep `aria` labels intact.
- Column reorder happens in `leagues/columns/table-columns.ts`
  (order + widths); the identity column keeps its sticky config.

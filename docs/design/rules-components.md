# Design Language — Component Rules

Per-component patterns and the anti-pattern quick-reference: categorical data, identity cells, tables, icons, tokens, shared-component ownership. Same rule format as the [visual system rules](rules-visual-system.md).

_Part of the [Design Language](DESIGN_LANGUAGE.md). Read the [index](DESIGN_LANGUAGE.md) for the map and reading order._

## Categorical data display

**Decision tree — choose exactly one:**

1. **Taxonomy label on an entity row** (an athlete's sport, an artist's genre) — a categorical dimension classifying a _person or act_, rendered inline in a dense data row:
   → `<Text c={getCategoryColor(item)} size="xs">` where `getCategoryColor` is the vertical's color-mapping function (e.g. `getSportColor`, `getGenreColor`).
   → **Never** `<Badge>` — Badge adds pill geometry (border-radius, padding) that misaligns text in dense rows and competes with row borders.

   **Catalog rows are the exception:** when the row _is_ the category's container — a league tagged with its sport, a playlist tagged with its platform — the tag is a quiet neutral chip inline with the name (`<Badge variant="default" c="dimmed" ff="monospace" fw={400} tt="none" radius="sm">`), not colored text. The color signal belongs to classification of entities, not to a row describing its own kind.

2. **Level or tier** (2–4 discrete status values like Pro/College):
   → `<Badge variant="light" color={semanticColor}>` — a contained Badge communicates "this has a status."

3. **Momentum direction** (rising/steady/declining):
   → `<FontAwesomeIcon icon={faArrowUp|faMinus|faArrowDown} />` + `c={semanticColor}` on the surrounding element.
   → Never Unicode directional characters (`▲ ▼ —`). See [Icons](#icons).

4. **Secondary descriptive text** (not a filter/sort dimension, not a status):
   → `<Text c="dimmed" size="xs">` — only for genuinely ignorable metadata.

**Anti-pattern — `Badge variant="dot"` in table cells:** The dot indicator is designed for list items and menu entries. Inside a `Table.Td` it causes text misalignment and adds noise without informational value.

## Identity cell composition

The three-line hierarchy for any entity identity cell in a data table. The pattern is fixed; only the content of each line varies by vertical:

```
<Group gap="sm" wrap="nowrap">
  <Avatar size={40} radius="50%" bd="1px solid var(--mantine-color-default-border)" />
  <Stack gap={2} miw={0}>
    <Group gap={6} wrap="nowrap">         ← Line 1: name + inline badge
      <Text fw={600} size="sm" truncate>
      [optional verified icon]
    </Group>
    <Group align="center" gap={4}>        ← Line 2: geography + taxonomy
      <CountryFlag />                     (CountryFlag renders Text size="sm")
      <Text c={color} size="xs" truncate>
    </Group>
    <Group gap={4} mt={2} wrap="nowrap">  ← Line 3: social/action icons
      <Anchor size="xs" c="dimmed">
        <FontAwesomeIcon />
      </Anchor>
    </Group>
  </Stack>
</Group>
```

**Rules:**

- **Avatar:** `size={40}` (large enough for face recognition, small enough to let text drive row height). `radius="50%"` (round) for people; `radius="sm"` for organisations, teams, or brands. The radius scale is square-leaning, so no scale key produces a circle — a person avatar states the percentage. `bd="1px solid var(--mantine-color-default-border)"` — required when the image may be absent (initials fallback) or when the photo background matches the page background; the 1px ring adapts to light/dark mode.
- **Stack gap:** `gap={2}` between all three lines.
- **Social row extra gap:** the social `<Group>` carries `mt={2}` in addition to the Stack `gap={2}`, giving 4px total before the social row.
- **Cell text renders through the shared primitives** (`@repo/ui/cell-text`, `@repo/ui/numeric-cell`, `@repo/ui/entity-chip`, `@repo/ui/kind-tag`) — not raw `Text`. See [Shared-component ownership](#shared-component-ownership).
- Line heights follow `font-size × 1.55`: `size="sm"` → 21.7px (lines 1–2, and CountryFlag which is `size="sm"`), `size="xs"` → 18.6px (line 3).

## Data display integrity

Rules harvested from real shipped defects. Each one was a visible bug.

- **Display labels are never raw data values.** A warehouse enum arrives in whatever casing the pipeline stored (`football`, `tennis`); render it through a label formatter that capitalizes (`toDisplayLabel` / `toSportLabel`), in **every** surface that shows it — table cells and filter pills alike. A page that renders one casing in the cell and another in the pill is showing the user the database, not the product.
- **Platform-specific metrics name their platform.** A filter or column called "Reach" hides which platform it measures; label it "IG Reach" and define the aggregation in the column tooltip (sum of tracked athletes' Instagram followers, not a deduplicated audience). Users decide on these numbers — ambiguity about the source is a data bug, not a copy nit.
- **Filter–column parity.** Every metric dimension offered as a filter exists as a visible, sortable column. Filtering by a value the user cannot see or rank by makes the filter's effect unverifiable. When a filter is added, its column lands in the same change.
- **Tooltips are themed surfaces, and overflow affordances summarize — they never enumerate.** A tooltip uses the Mantine `Tooltip` surface so it adapts to the color scheme; a default-styled floating box reads as foreign chrome. A "+N" affordance may expand to a _few_ more items (cap ~10 with an ellipsis) or explain what N counts — a tooltip listing 42 entries is a wall of text. If the full set matters, it belongs on a detail surface, not a hover.
- **Floating surfaces follow the active color scheme — never invert.** Set Tooltip/popover colors once in the shared theme so both schemes resolve to a same-scheme surface; never restyle per call site.

## Table loading states

### Two distinct states — do not conflate

| Trigger                                                               | State        | Correct pattern                                                          |
| --------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `query.isPending` — no data exists yet                                | Initial load | Show the full skeleton (toolbar + table + footer)                        |
| `query.isFetching && !query.isPending` — data exists, being refreshed | Refetch      | Replace body rows with the existing `SkeletonDataRow`; headers stay real |

For the refetch state, pass `renderSkeletonRow` to `DataTable` only while fetching — the prop's presence is the signal; `DataTable` has no separate `isFetching` prop:

```tsx
<DataTable
  renderSkeletonRow={
    isFetching
      ? (index) => <SkeletonDataRow index={index} key={index} />
      : undefined
  }
  ...
/>
```

Headers stay real so the user can see which column was just sorted. Row count stays fixed (equal to `rows.length`) so there is no layout shift. `LoadingOverlay` (blurred gray sheet + spinner) is not used — it hides the table structure and teaches the user nothing about the incoming layout.

### Skeleton structure rules

**The skeleton must mirror the complete loaded layout — every missing structural element causes a layout shift on transition.** Every data table skeleton contains all three structural regions:

1. **Skeleton toolbar** — `<Group justify="space-between" {...TABLE_TOOLBAR_PADDING}>` with placeholder bars.
2. **Table body** — `<Table.ScrollContainer>` → `<Table verticalSpacing={TABLE_VERTICAL_SPACING}>` → `<Thead>`/`<Tbody>` mirroring the real column widths and order.
3. **Skeleton footer** — `<Group justify="space-between" {...TABLE_FOOTER_PADDING}>` with placeholder bars.

**Skeleton bar height — use CSS variables, not integer px:**

```tsx
// Correct — sub-pixel precision matches actual Text line-height
<Skeleton height="calc(var(--mantine-font-size-sm) * 1.55)" w="75%" />
<Skeleton height="calc(var(--mantine-font-size-xs) * 1.55)" w={72} />

// Wrong — integer px rounds up from 21.7/18.6px, accumulates ~1px drift per row
<Skeleton height={22} w="75%" />
<Skeleton height={19} w={72} />
```

Mantine Text renders at `font-size × 1.55`, not font-size alone. `calc(var(--mantine-font-size-sm) * 1.55)` lets the browser compute the same sub-pixel value it uses for the actual `Text` element, eliminating drift.

**Checklist before shipping a skeleton:**

1. **Check whether a skeleton row component already exists for this table before writing a new one.** The existing component has correct per-column widths, avatar circles, and text-line bar heights.
2. Identify every structural region of the loaded component (header, toolbar, table, footer, pagination).
3. For each region: is it rendered while `isPending`? If not, add a placeholder spreading the same exported padding constant the real region uses.
4. **Row count must equal the page size** — import the page-size constant and drive `Array.from({ length: PAGE_SIZE })` from it. Never hardcode a row count.
5. Confirm bar heights use the CSS variable formula, not integer px.
6. Confirm avatar placeholder uses `<Skeleton circle height={avatarSize}>` (not a rectangle).

## Sort icon and sorted headers

From `DataTable.tsx` `sortIcon()`:

```tsx
// Correct
const sortIcon = (
  isActive: boolean,
  direction: DataTableSortDirection,
): ReactNode => {
  if (!isActive) return null; // ← no icon on inactive columns
  return direction === "asc" ? (
    <FontAwesomeIcon icon={faArrowUp} />
  ) : (
    <FontAwesomeIcon icon={faArrowDown} />
  );
};

// Wrong
if (!isActive) return <FontAwesomeIcon icon={faArrowsUpDown} />; // adds noise to every header
```

Showing a bidirectional arrow on every sortable header adds noise without informational value. The direction only matters on the currently-sorted column; inactive columns are identified by their label alone.

**Sorted metric headers read as one unit.** On right-aligned numeric columns the arrow precedes the label; inactive headers reserve the arrow's box invisibly so all headers share a baseline and nothing shifts when sort moves. Sort lives in the page header as a menu (re-selecting the active column flips direction); a separate "Sort:" caption row is dead space.

**Accessibility:** the sort icon is wrapped in `<span aria-hidden="true">`; sort state reaches screen readers via `aria-sort` on the `<th>`, not the visible icon.

## Row hover

This is the canonical instance of the [one-notch rule](rules-visual-system.md#interactive-state-and-tone).

```tsx
// Set on the Paper wrapper that owns this table — not on DataTable itself
const ROW_HOVER_STYLE = {
  "--table-highlight-on-hover-color":
    "light-dark(var(--mantine-color-gray-1),var(--mantine-color-<accent>-light))",
} as const;

<Paper shadow="sm" radius="md" style={ROW_HOVER_STYLE}>
  <DataTable ... />
</Paper>
```

Replace `<accent>` with the vertical's accent color from [Vertical accent colors](rules-visual-system.md#vertical-accent-colors). Light-mode hovers are gray — color on hover reads as selection, not affordance. In dark mode gray steps vanish against the near-black body, so the accent's `-light` wash carries the hover there.

**Rules:**

- Set it on the nearest Paper ancestor that owns this specific table. Never on `DataTable` itself — `DataTable` is shared; its default stays neutral.
- The gray side always comes first in the `light-dark()`; only the dark side is vertical-accented.
- Sticky cells in `DataTable.module.css` inherit this CSS variable in their `tr:hover` rule to keep hover consistent across frozen and scrollable columns.

## Icons

**Always FontAwesome, always the regular (outline) style. Never solid, never Unicode.**

```tsx
// Correct — pro-regular, imported by full path
import { faArrowUp } from "@fortawesome/pro-regular-svg-icons/faArrowUp";
import { faArrowDown } from "@fortawesome/pro-regular-svg-icons/faArrowDown";
import { faMinus } from "@fortawesome/pro-regular-svg-icons/faMinus";
<FontAwesomeIcon icon={faArrowUp} />

// Wrong
import { faArrowUp } from "@fortawesome/pro-solid-svg-icons/faArrowUp"; // solid weight
"▲"  "▼"  "—"  "↑"  "↓"                                                 // Unicode characters
```

**Outline, not solid.** The interface reads as a calm working tool; outline glyphs sit quieter beside dense text than filled silhouettes. Use `@fortawesome/pro-regular-svg-icons` throughout. A glyph that is _inherently_ a filled silhouette is the wrong glyph — pick an outline-native one.

**Why Unicode fails:**

1. **Size:** scales with `font-size`, not the icon grid — looks wrong at `size="xs"` or `size="xl"`.
2. **Color:** cannot be reliably tinted with Mantine's `c` prop across browsers.
3. **Accessibility:** screen readers announce "black up-pointing triangle" — meaningless. FA icons get `aria-hidden` and are supplemented by accessible labels in surrounding text.

**Import rule:** import each icon by its full path (`/faArrowUp`), not from the barrel (`@fortawesome/pro-regular-svg-icons`). Barrel imports defeat tree-shaking.

## Theme tokens

Everything geometric or typographic is owned by `packages/ui/theme/theme.ts` and verified against the deployed prototype. **Read values from the theme, not from this document** — a number written in prose is stale the moment the token changes (the repo's own learned rule). [Typography](rules-visual-system.md#typography) and [density](rules-visual-system.md#spacing-and-table-density) rules live in the visual system. One radius rule belongs here: the scale is square-leaning to match the prototype — cards and table Papers use `md`, controls default smaller, and no key produces a circle, so a person avatar asks for `radius="50%"` directly while organisation marks stay `sm` (see [Identity cell composition](#identity-cell-composition)).

**Deliberate exceptions (recorded here per the repo rule that an exception lives where its rule lives):**

- **Ordinal / rank columns (`#`) stay left-aligned** beside the identity column, against the general "numbers right-align" rule. They are row labels, not measurements, and the reference design reads them that way. `NumericCell` still renders them via `ff="monospace"`.

## Mantine mechanics

Implementation gotchas the parity work paid for. The general lesson: **verify the rendered DOM, not the prop name** — Mantine's `disabled`, `Tooltip` events, and `NavLink` semantics all under-deliver silently.

- **Variant colors arrive as inline-style variables.** Class-level `--badge-*`/`--button-*` assignments always lose to them; override the real CSS properties with a doubled-class selector (`.chip.chip { background-color: … }`). Import order also matters: page CSS modules load before `@mantine/core/styles.css`, so a single class ties on specificity and loses on order.
- **`--input-bd` and `--button-bd` do not read `--mantine-color-default-border`.** Route them through it explicitly in the theme's component vars, alongside the `cssVariablesResolver` that softens the default border.
- **`NavLink` without `component={Link}` is an `<a>` with no href** — role `generic`, where `aria-disabled` is unsupported. Render `component="button"` with the disabled state exposed (Mantine's `disabled` styles but does not forward the native attribute — set `aria-disabled` yourself), and assert through `getByRole(role, { name })`.
- **Mantine tooltips need `events={{ focus: true }}` to open for keyboard users,** and the tooltip must sit on the focusable element itself, never on a wrapper around it.

## Shared-component ownership

**Design constants and cell primitives have exactly one owner, in `@repo/ui` — never per feature.** A `cell-typography.ts` duplicated into two page trees is a defect. The scale, chip styling, hover behavior, and overflow budgets live in shared components and theme tokens; a feature that needs them imports them.

**Cells render through the shared primitives, not raw Mantine.** Table cell text → `@repo/ui/cell-text`, numbers → `@repo/ui/numeric-cell`, entity references → `@repo/ui/entity-chip`, kind tags → `@repo/ui/kind-tag`, quick filters → `@repo/ui/pill` / `pill-group` / `single-select-pills`. Passing `size`/`ff`/ink props to a bare `Text` in a cell means a primitive is missing — add it there, not locally. A constant that a second module must match is exported and imported, never restated.

**The nav shell is shared; verticals contribute only content.** One navbar implementation serves every vertical; what differs is declared data — sections, items, labels, paths — supplied by that vertical's config and rendered by the shared shell. Behavior (collapse, active state, a11y, hover) never forks per vertical.

**Do not add a `packages/ui` export for a pattern used by only one consumer.** Colocate in the consuming app until two distinct consumers exist (ADR-006).

## Anti-patterns

These patterns caused real defects. Each has been fixed; this table prevents regression and is the single scannable quick-reference — the prose sections above are the rationale.

| Anti-pattern                                                                             | Correct alternative                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `c="dimmed"` or `color="gray"` for any filter/sort dimension (category, level, momentum) | `c={getCategoryColor(item)}` or the appropriate semantic color from the vertical's color function |
| `<Badge variant="dot">` inside a dense table cell                                        | `<Text c={color} size="xs">` for taxonomy labels; `<Badge variant="light">` for status/level      |
| FontAwesome **solid** (`pro-solid`) icons                                                | `pro-regular` (outline), imported individually by path                                            |
| Unicode directional characters (`▲ ▼ — ↑ ↓`)                                             | FA outline icons from `@fortawesome/pro-regular-svg-icons`                                        |
| Black text on a dark fill / any label not measured against its actual background         | Choose the label color for its fill; meet WCAG 2.2 AA in both schemes                             |
| A bright/saturated wash on hover or a light-mode row                                     | One gray step in light mode; the accent `-light` wash only in dark mode                           |
| A control isolated in an otherwise-empty toolbar row                                     | Move it onto the title/count or filter row; no row >~60% empty                                    |
| `<Paper withBorder>` on a plain page background                                          | `<Paper shadow="sm" radius="md">`                                                                 |
| Different Paper variants across state siblings (loading/empty/error/data)                | Same `shadow="sm" radius="md"` on all states                                                      |
| Skeleton that covers only data rows but not toolbar or footer                            | Mirror the complete layout including toolbar and footer structural rows                           |
| Hardcoded skeleton row count that doesn't match the page size                            | Import the page-size constant; drive `Array.from({ length: PAGE_SIZE })` from it                  |
| Skeleton bar `height={N}` (integer px) for a text row                                    | `height="calc(var(--mantine-font-size-sm) * 1.55)"` (or `xs` variant)                             |
| Sort icon on every sortable column header                                                | `return null` for inactive columns; directional icon only on the active column                    |
| `minWidth` on the scroll container `<div>` instead of on `<Table>`                       | Apply `style={{ minWidth }}` to `<Table>`, not the wrapper `<div>`                                |
| Restating a token value (radius, padding, font size) in prose or a quick-reference       | Name the owning module (`theme.ts`, `@repo/ui/data-table`) and read the value from it             |
| A new component library installed alongside Mantine                                      | Mantine props, variants, CSS vars, and `factory()` only                                           |
| A new `packages/ui` export for a pattern used by only one consumer                       | Colocate in the consuming app until two distinct consumers exist (ADR-006)                        |
| Two props that always travel together (`isFetching` + `renderSkeletonRow`)               | One prop that carries both the state and the render fn; the prop's presence is the signal         |

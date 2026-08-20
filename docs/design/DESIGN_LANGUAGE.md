# Design Language

Chartmetric-specific design decisions for `apps/web/`. Every rule follows the pattern: **condition → Mantine API call → one-sentence why → exception if any.**

This document is the single source of truth for all verticals (athletes, music artists, creators, and any future entity type). Rules are derived from real implementation work and apply universally unless a section explicitly marks a rule as vertical-specific. `apps/web/AGENTS.md` and `packages/ui/AGENTS.md` carry short-form pointers; the `web-design-guidelines` skill prepends a read instruction. Do not duplicate rules across files.

## Vertical accent colors

Each vertical has one primary Mantine color that repeats across: taxonomy labels, row hover, and level badge tint. The color must carry semantic meaning at product level, not be arbitrary.

| Vertical          | Accent color                                            | Semantic meaning                                                    |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Athletes / sports | `teal`                                                  | Active, established, primary-positive                               |
| Music artists     | `teal`                                                  | Active, established, primary-positive                               |
| _(future)_        | `teal` until a distinct semantic meaning is established | Add a row here with rationale before switching to a different color |

References to "the vertical's accent color" throughout this document mean: look up the current page's vertical in this table. All current verticals use `teal`.

---

## Color semantics

These are the semantic meanings of Mantine color names in this codebase. The meaning is fixed regardless of vertical — the same color must carry the same signal everywhere it appears.

| Color             | Semantic meaning                                                                      | Use for                                                          |
| ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `dimmed` / `gray` | Absent, unknown, or unclassified. Secondary text the user does NOT filter or sort on. | Unknown/fallback category; secondary metadata; social icon links |
| `teal`            | Active, established, primary-positive. The shared accent color across all verticals.  | Row hover; "Pro" / top-tier level badge; taxonomy labels         |
| `orange`          | Rising, momentum-up, energetic.                                                       | Momentum-up indicator; high-energy category labels               |
| `grape`           | Niche/specialist.                                                                     | Specialist category labels (e.g. racket sports, niche genres)    |
| `blue`            | Developmental, informational, aspirational.                                           | Verified badge; "College" / growth-tier badge                    |
| `red`             | Declining, momentum-down, error-adjacent.                                             | Momentum-down indicator; error states                            |
| `green`           | Positive/steady momentum.                                                             | Momentum-steady indicator                                        |

**Critical rule:** Never use `c="dimmed"` or `color="gray"` for a value the user can filter or sort on. Dimmed communicates "secondary/ignorable." Any category, level, or momentum dimension is a filter/sort axis — it must use semantic color.

**Adding a new color:** before using a Mantine color not listed above, add it to this table with a one-line semantic meaning. Never pick a color for aesthetics alone — it must carry the same meaning in every context it appears.

---

## Spacing

Two-tier system. **Mantine token strings** for structural/container-level spacing where breathing room is the goal. **Raw px integers** for intra-cell dense gaps where tighter control is needed and Mantine's smallest token (`xs` = 8px) is already too much.

### Container padding

Every structural chrome region uses consistent padding so the table edges stay visually aligned across all states (loading, empty, error, data):

| Region              | Props             | Why                                                                                                                                  |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Toolbar row         | `px="md" py={4}`  | Medium horizontal keeps content clear of Paper edge; 4px vertical keeps the sort summary a caption on the table, not a band above it |
| Footer row          | `px="md" py="xs"` | Same horizontal alignment as toolbar; slightly taller vertical because pagination controls need more touch target height             |
| Empty / error state | `p="xl"`          | Full padding on all sides — the state fills the Paper with nothing else competing for space                                          |
| Page-level Stack    | `gap="md"`        | Medium vertical separation between filters, alerts, and the table card                                                               |

Do not restate these paddings. `@repo/ui/data-table` exports `TABLE_TOOLBAR_PADDING` and `TABLE_FOOTER_PADDING`; the real toolbar, the real footer, and the skeleton that stands in for both spread the same object, so the container dimensions cannot drift between states.

### Table density

`DataTable` owns row height: it applies the exported `TABLE_VERTICAL_SPACING` (`"sm"`) to its `<Table>`, and a skeleton's `<Table>` imports the same constant. Never pass `verticalSpacing` per page and never add `py` to `Table.Td` or override it per cell. The product is data-dense — the reference tables read correctly at what a looser scale showed at 80% zoom — and `sm` still clears a three-line identity cell.

### Intra-cell gap scale

Inside a table cell, use raw px integers. Mantine's `xs` (8px) is the smallest token but is already too wide for tight icon+label pairs in a dense row.

| Value      | Use case                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `gap={2}`  | Vertical spacing between lines in a multi-line Stack (identity cell text lines)                                                 |
| `gap={4}`  | Horizontal spacing in compact icon+label or icon+icon pairs (momentum cell, social links, pill group label+items)               |
| `gap={6}`  | Horizontal spacing in a single-row label+badge or label+icon pair (name + verified icon, header label + sort icon, logo + name) |
| `gap="sm"` | Between a large element (avatar) and its accompanying text block — the larger visual mass needs more breathing room             |
| `gap={0}`  | Intentional zero gap: stacked primary/secondary text lines that should read as one unit (e.g. league name above league tier)    |

### Overflow and truncation

Every text-containing `Stack` or `Group` inside a table cell must carry `miw={0}` and `wrap="nowrap"`:

```tsx
// Correct — text truncates cleanly instead of breaking the column width
<Group gap="sm" wrap="nowrap">
  <Avatar ... />
  <Stack gap={2} miw={0}>
    <Text truncate>...</Text>
  </Stack>
</Group>

// Wrong — without miw={0}, flexbox minimum-content width prevents truncation
<Stack gap={2}>
  <Text truncate>...</Text>   {/* truncate has no effect */}
</Stack>
```

`miw={0}` overrides flexbox's default `min-width: auto`, which otherwise prevents a flex child from shrinking below its content width. Without it, `truncate` is silently ignored. Apply it to every `Stack` or `Group` that sits inside a flex container and contains truncatable text.

### Social/action row separation

The social icon row inside an identity cell uses `mt={2}` in addition to the parent Stack's `gap={2}`, giving 4px total above the social row. This extra separation marks the visual boundary between informational lines (name, category) and actionable links (platform icons) without needing a divider.

---

## Surface hierarchy

**Data tables and their state siblings:**
Use `<Paper shadow="sm" radius="md">` without `withBorder` when the Paper sits on a plain page background (gray-0 or page default).

**Why:** `withBorder` adds a hard 1px edge that reads as a panel boundary and competes visually with the table's own row dividers. `shadow="sm"` achieves visual lift at lower contrast cost.

**Critical rule for state siblings:** Loading skeleton, data table, empty state, and error state all use the **same Paper props** (`shadow="sm" radius="md"`). If one state uses `withBorder` and another uses `shadow`, the page appears to change containers on transition — the user's eye notices the border appearing where there was a shadow.

**Exception:** Use `withBorder` when the Paper is nested inside another elevated container (modal, drawer, another Paper with shadow). In that case, shadow-on-shadow reads as floating; a border gives a definite edge.

**Form inputs and filter controls:** Use `withBorder`. Controls need a definite, clickable edge.

**Never use both** `shadow` and `withBorder` on the same element.

---

## Categorical data display

**Decision tree — choose exactly one:**

1. **Taxonomy label on an entity row** (an athlete's sport, an artist's genre) — a categorical dimension classifying a _person or act_, rendered inline in a dense data row:
   → `<Text c={getCategoryColor(item)} size="xs">` where `getCategoryColor` is the vertical's color-mapping function (e.g. `getSportColor`, `getGenreColor`).
   → **Never** `<Badge>` — Badge adds pill geometry (border-radius, padding) that misaligns text in dense rows and visually competes with row borders.

   **Catalog rows are the exception** (parity finding, 2026-08-19): when the
   row _is_ the category's container — a league tagged with its sport, a
   playlist tagged with its platform — the tag is a quiet neutral chip inline
   with the name (`<Badge variant="default" c="dimmed" ff="monospace"
fw={400} tt="none" radius="sm">`), not colored text. The color signal
   belongs to classification of entities, not to a row describing its own
   kind.

2. **Level or tier** (2–4 discrete status values like Pro/College):
   → `<Badge variant="light" color={semanticColor}>` — contained Badge communicates "this has a status."

3. **Momentum direction** (rising/steady/declining):
   → `<FontAwesomeIcon icon={faArrowUp|faMinus|faArrowDown} />` + `c={semanticColor}` on the surrounding element.
   → Never Unicode directional characters (`▲ ▼ —`). See Icons section.

4. **Secondary descriptive text** (not a filter/sort dimension, not a status):
   → `<Text c="dimmed" size="xs">` — only for genuinely ignorable metadata.

**Anti-pattern — `Badge variant="dot"` in table cells:** The dot indicator is designed for list items and menu entries. Inside a `Table.Td`, it causes text misalignment and adds visual noise without informational value. Do not use it in data tables.

---

## Identity cell composition

The three-line hierarchy for any entity identity cell in a data table (athlete, artist, creator, or any future entity type). The pattern is fixed; only the specific content of each line varies by vertical:

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

- **Avatar:** `size={40}` (large enough for face recognition, small enough to let text drive row height). `radius="50%"` (round) for people; `radius="sm"` for organisations, teams, or brands. The radius scale is square-leaning, so no scale key produces a circle — a person avatar states the percentage. `bd="1px solid var(--mantine-color-default-border)"` — required when the image may be absent (initials fallback) or when the photo background matches the page background; the 1px ring uses the default border color and adapts to light/dark mode.
- **Stack gap:** `gap={2}` between all three lines.
- **Social row extra gap:** The social `<Group>` carries `mt={2}` in addition to the Stack `gap={2}`, giving 4px total before the social row. This matches the visual weight of the icon row versus text rows.
- **Line 1 height** (Text `size="sm"`, 14px): rendered line-height = `14 × 1.55 = 21.7px`.
- **Line 2 height** (CountryFlag is `Text size="sm"`, not `xs`): rendered line-height = 21.7px. The sport text (`size="xs"`) is shorter but the Group `align="center"` is driven by the taller flag — both are 21.7px.
- **Line 3 height** (Anchor `size="xs"`, 12px): rendered line-height = `12 × 1.55 = 18.6px`.

---

## Table loading states

### Two distinct states — do not conflate

| Trigger                                                               | State        | Correct pattern                                                          |
| --------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `query.isPending` — no data exists yet                                | Initial load | Show the full skeleton (toolbar + table + footer)                        |
| `query.isFetching && !query.isPending` — data exists, being refreshed | Refetch      | Replace body rows with the existing `SkeletonDataRow`; headers stay real |

For the refetch state, pass `isFetching` and `renderSkeletonRow` to `DataTable`:

```tsx
<DataTable
  isFetching={isFetching}
  renderSkeletonRow={(index) => <SkeletonDataRow index={index} key={index} />}
  ...
/>
```

Headers stay real so the user can see which column was just sorted. Row count stays fixed (equal to `rows.length`) so there is no layout shift. `LoadingOverlay` (blurred gray sheet + spinner) is not used — it hides the table structure and teaches the user nothing about the incoming layout.

### Skeleton structure rules

**The skeleton must mirror the complete loaded layout — every missing structural element causes a layout shift on transition.**

Every data table skeleton must contain all three structural regions:

1. **Skeleton toolbar** — `<Group justify="space-between" {...TABLE_TOOLBAR_PADDING}>` with placeholder bars. If absent, the skeleton card is shorter than the loaded card and jumps down when data arrives.
2. **Table body** — `<Table.ScrollContainer>` → `<Table verticalSpacing={TABLE_VERTICAL_SPACING}>` → `<Thead>`/`<Tbody>` mirroring the real column widths and order.
3. **Skeleton footer** — `<Group justify="space-between" {...TABLE_FOOTER_PADDING}>` with placeholder bars. Same layout-shift risk if absent.

**Skeleton bar height — use CSS variables, not integer px:**

```tsx
// Correct — sub-pixel precision matches actual Text line-height
<Skeleton height="calc(var(--mantine-font-size-sm) * 1.55)" w="75%" />
<Skeleton height="calc(var(--mantine-font-size-xs) * 1.55)" w={72} />

// Wrong — integer px rounds up from 21.7/18.6px, accumulates ~1px drift per row
<Skeleton height={22} w="75%" />
<Skeleton height={19} w={72} />
```

**Why:** Mantine Text renders at `font-size × line-height (1.55)`, not font-size alone. `size="sm"` → 14px × 1.55 = 21.7px. Using `height={22}` is 0.3px too tall per bar; across three bars and eight rows this accumulates to ~7px of total drift. Using `calc(var(--mantine-font-size-sm) * 1.55)` lets the browser compute the same sub-pixel value it uses for the actual `Text` element, eliminating drift.

**Quick reference:**

| Text size   | Font size | Formula                                    | ~px  |
| ----------- | --------- | ------------------------------------------ | ---- |
| `size="sm"` | 14px      | `calc(var(--mantine-font-size-sm) * 1.55)` | 21.7 |
| `size="xs"` | 12px      | `calc(var(--mantine-font-size-xs) * 1.55)` | 18.6 |

**Checklist before shipping a skeleton:**

1. **Check whether a skeleton row component already exists for this table before writing a new one.** The existing component has correct per-column widths, avatar circles, and text-line bar heights. A generic `<Skeleton height={12} />` dropped into every cell ignores all of that work.
2. Identify every structural region of the loaded component (header, toolbar, table, footer, pagination).
3. For each region: is it rendered while `isPending`? If not, add a placeholder spreading the same exported padding constant the real region uses.
4. **Row count must equal the page size** — import the page-size constant and drive `Array.from({ length: PAGE_SIZE })` directly from it. Never hardcode a row count. A number that doesn't match the real page size produces a skeleton taller or shorter than the loaded table, which is a layout shift.
5. Confirm bar heights use the CSS variable formula, not integer px.
6. Confirm avatar placeholder uses `<Skeleton circle height={avatarSize}>` (not a rectangle).

---

## Sort icon — active column only

From `DataTable.tsx` `sortIcon()` function:

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

**Why:** Showing a bidirectional arrow on every sortable column header adds visual noise without informational value. The sort direction only matters on the column that is currently sorted. Inactive columns are identified by their label alone.

**Accessibility:** The sort icon is wrapped in `<span aria-hidden="true">`. Sort state is communicated to screen readers via `aria-sort` on the `<th>` element, not via the visible icon.

---

## Row hover accent

```tsx
// Set on the Paper wrapper that owns this table — not on DataTable itself
const HOVER_STYLE = {
  "--table-highlight-on-hover-color": "var(--mantine-color-<accent>-light)",
} as const;

<Paper shadow="sm" radius="md" style={HOVER_STYLE}>
  <DataTable ... />
</Paper>
```

Replace `<accent>` with the vertical's accent color from the [Vertical accent colors](#vertical-accent-colors) table. All current verticals use `teal`.

**Why:** The `-light` variant is Mantine's soft wash (very subtle in light mode, tinted in dark mode). It reinforces the vertical's identity on every row hover at zero extra DOM cost.

**Rules:**

- Set it on the nearest Paper ancestor that owns this specific table. Never on `DataTable` itself — `DataTable` is shared; its default stays neutral.
- All current verticals use `teal`. If a future vertical adopts a different accent, update the [Vertical accent colors](#vertical-accent-colors) table first, then set the corresponding `-light` token here.
- Sticky cells in `DataTable.module.css` inherit this CSS variable in their `tr:hover` rule to maintain consistent hover appearance across frozen and scrollable columns.

---

## Icons

**Always use FontAwesome. Never use Unicode.**

```tsx
// Correct
import { faArrowUp } from "@fortawesome/pro-solid-svg-icons/faArrowUp";
import { faArrowDown } from "@fortawesome/pro-solid-svg-icons/faArrowDown";
import { faMinus } from "@fortawesome/pro-solid-svg-icons/faMinus";
<FontAwesomeIcon icon={faArrowUp} />

// Wrong
"▲"  "▼"  "—"  "↑"  "↓"   // Unicode characters
```

**Why Unicode fails:**

1. **Size:** scales with `font-size`, not with the icon grid — looks wrong at `size="xs"` or `size="xl"`.
2. **Color:** cannot be reliably tinted with Mantine's `c` prop across browsers.
3. **Accessibility:** screen readers announce "black up-pointing triangle" — meaningless in context. FA icons get `aria-hidden` and are supplemented by accessible labels in surrounding text.

**Import rule:** import each icon by its full path (`/faArrowUp`), not from the barrel (`@fortawesome/pro-solid-svg-icons`). Barrel imports defeat tree-shaking.

---

## Data display integrity

Rules harvested from the leagues page design review (2026-08-19). Each
came from a real defect visible in the shipped page.

**Display labels are never raw data values.** A warehouse enum arrives
in whatever casing the pipeline stored (`football`, `tennis`); render it
through a label formatter that capitalizes (`toDisplayLabel` /
`toSportLabel`), in every surface that shows it — table cells and filter
pills alike. A page that renders one casing in the cell and another in
the pill is showing the user the database, not the product.

**Peer columns share one type scale.** Cells that sit side by side in
the same row band use the same Mantine text size; a column whose text is
visibly larger than its neighbours reads as emphasis the data does not
justify. When two columns genuinely need different weights, vary `fw` or
color, not `size`.

**Tooltips are themed surfaces, and overflow affordances summarize —
they never enumerate.** A tooltip uses the Mantine `Tooltip` surface so
it adapts to the color scheme; a default-styled floating box reads as
foreign chrome. And a "+N" affordance may expand to a _few_ more items
(cap ~10 with an ellipsis) or simply explain what N counts — a tooltip
listing 42 entries is a wall of text nobody can scan. If the full set
matters, it belongs on a detail surface, not in a hover.

**Platform-specific metrics name their platform.** A filter or column
called "Reach" hides which platform it measures; label it "IG Reach"
(and define the aggregation in the column tooltip: sum of tracked
athletes' Instagram followers, not a deduplicated audience). Users make
decisions on these numbers — ambiguity about the source is a data bug,
not a copy nit.

**Filter–column parity.** Every metric dimension offered as a filter
exists as a visible, sortable column. Filtering by a value the user
cannot see or rank by makes the filter's effect unverifiable ("why did
this league disappear?"). When a filter is added, its column lands in
the same change.

## Theme tokens (prototype parity)

Verified against the deployed prototype's CSS (2026-08-19):
`--app-font-sans: "Inter"`, `--app-font-mono: "Space Mono", Menlo,
monospace`, `--radius: 0.3rem`.

**Typography.** Inter is the UI face (already the theme `fontFamily`).
`Space Mono` is the data face: numeric table cells, counts, and metric
values render in the theme `fontFamilyMonospace`. Numbers in a table
column share the exact text size of neighbouring text cells, right-align,
and line up digit-for-digit down the column (the mono face provides
tabular figures inherently). A numeric column is never an exception to
the peer-column type-scale rule. One deliberate exception: ordinal/rank
columns (`#`) stay left-aligned beside the identity column — they are row
labels, not measurements, and the reference design reads them that way. One `NumericCell` renders every such
value with `ff="monospace"`, which resolves to the theme face — no cell
ever names the family.

**Radius.** The scale is square-leaning to match the prototype's
`0.3rem` base: `xs 0.125rem / sm 0.1875rem / md 0.3rem / lg 0.375rem /
xl 0.5rem`. Cards and table Papers use `md`; controls default smaller.
No key on this scale produces a circle, so a person avatar asks for
`radius="50%"` directly; organisation marks stay `sm` per the
identity-cell rule.

**Floating surfaces follow the active color scheme — never invert.**
A tooltip or popover that renders dark-on-light in light mode and
light-on-dark in dark mode reads as foreign chrome and fails the
state-sibling consistency principle. Set the Tooltip (and any floating
surface) colors once in the shared theme so both schemes resolve to a
same-scheme surface; never restyle per call site.

**Density.** The product is data-dense; the reference tables read
correctly at what the previous scale showed at 80% zoom. Tables use
`verticalSpacing="sm"`; toolbar rows `py={4}`; footer rows `py="xs"`.
Distribute row width by content: identity columns get fixed widths,
list columns (chips, nationality lists) flex, numeric metric columns
get compact fixed widths at the right edge.

**Page header composition.** One header row owns the page's controls:
title + live count, inline search, then quick-filter pill groups — in
that order, wrapping as a group. A search input never floats detached
in the page corner; if it filters the table, it sits with the other
things that filter the table.

**Column order.** Identity leftmost (after the ordinal), descriptive
list columns next, numeric metric columns at the right edge. For
leagues: `# | League/Competition | Key Athletes | Nationalities |
Athletes | IG Reach`.

## Visual parity findings (2026-08-19 loop)

Harvested from the driver-executed screenshot loop against the reference
prototype (phase 07). Each was a real delta; each is now a rule.

**One bold element per row.** The identity name is the only `fw={600}`
text in a data row. Chips, list cells, metric values, and column
headers are regular weight — bolding a metric or a chip flattens the
hierarchy bold exists to create.

**Column headers are quiet chrome.** Uppercase, mono, `c="dimmed"`,
`fw={500}`, `size="xs"`, letterspaced (`HEADER_LABEL_PROPS` in
`@repo/ui/data-table` owns this). Headers describe the data; they never
compete with it.

**Overflow counts flow inline.** The dimmed "+N" renders as a `span`
inside the wrapping list text, landing at the end of the last line —
never as its own block below the list.

**Wrapping list columns get a fixed width and dimmed mono text.** A
list cell (nationalities) wraps up to three lines inside a fixed-width
column; the wrap does the vertical work so row padding stays compact.

**Sort lives in the page header as a menu, not in a table toolbar
row.** Re-selecting the active column flips direction
(`changeQuerySort` owns that rule). A "Sort:" caption row above the
table is dead vertical space.

**Placeholder marks over initials for organisations.** A logo-less
league shows the domain icon (trophy) in its avatar, not initials —
initials read as a person.

**Dark means near-black.** The dark scheme's depth comes from a
teal-tinged near-black `colors.dark` scale owned by
`packages/ui/theme/theme.ts` (body ≈ `#0D1214`, cards one step up).
Mantine's default gray-dark reads washed next to the reference; never
lighten these tokens per surface.

**The type scale sits one notch below Mantine's defaults.** `fontSizes`
in the theme is the owner (xs 11px, sm 13px …); headings follow
(`h3` = 20px page titles). Do not compensate per component — a page
that looks oversized means a token is being overridden locally.

**Tags that will become links get a hover highlight now.** Key-athlete
chips brighten to the accent on hover (border + text), signalling the
future navigation affordance; the hover lives in a CSS module beside
the cell, not inline styles.

**Catalog avatars are 36px.** Entity identity avatars (people) stay
40px round; organisation logos in catalog rows sit at 36px square-ish
so the smaller type scale keeps driving row height.

**Controls are 26px; the filter row fits a laptop screen.** Buttons
and inputs at the default `xs` are 26px tall with 11px labels
(`packages/ui/theme/theme.ts` owns both vars); the nav rail is 220px.
The acceptance check is concrete: at a 1512px viewport, one header row
holds title + count + search + every pill group + the sort control with
margin to spare, and nothing wraps.

**The exact data type spec (from the reference's DevTools).** Table
data text is `"Space Mono", Menlo, monospace` at **12px on a 16px
line** (`fontSizes.xs = 0.75rem`, `lineHeights.xs = 1.334`), **weight
500 for the identity name, 400 for everything else**, ink `#17171c`
(the theme `black` — never `#0b1215`-hard). Skeleton bars derive from
`var(--mantine-line-height-*)`, never a literal multiplier.

**Icons are always outline (`pro-regular`), never solid.** This
includes nav, sort arrows, count pictograms, and placeholders. A glyph
that is inherently a filled silhouette (person-running) is the wrong
glyph — pick an outline-native one (people/user-group) instead.

**Bold belongs to the page title alone.** One bold element per page,
not per row: identity names are weight 500 mono, headers 500, data 400. If something else needs emphasis, it takes ink or size from the
established bands, not weight.

**Overflow counts are lighter than their list** (`gray-5`, glued to
the last item with a no-break space), and a wrapping list column never
shows an ellipsis — the preview count is budgeted so the wrap always
ends on a whole item + the count.

**Method note for the next loop.** Render the app without auth via an
untracked Vite entry (`preview.html` + `src/preview.tsx` mounting the
real tree minus `RequiredAuthProvider`), screenshot headless Chrome at
2000×1160 dark, compare against the reference, fix, repeat; delete the
preview entry when done. Every delta found lands here in the same
iteration.

## Anti-patterns

These patterns caused real defects during the athletes page implementation. Each one has been fixed; this list prevents regression.

| Anti-pattern                                                                             | Correct alternative                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `c="dimmed"` or `color="gray"` for any filter/sort dimension (category, level, momentum) | `c={getCategoryColor(item)}` or the appropriate semantic color from the vertical's color function |
| `<Badge variant="dot">` inside a dense table cell                                        | `<Text c={color} size="xs">` for taxonomy labels; `<Badge variant="light">` for status/level      |
| Unicode directional characters (`▲ ▼ — ↑ ↓`)                                             | FA icons from `@fortawesome/pro-solid-svg-icons`, imported individually by path                   |
| `<Paper withBorder>` on a plain page background                                          | `<Paper shadow="sm" radius="md">`                                                                 |
| Different Paper variants across state siblings (loading/empty/error/data)                | Same `shadow="sm" radius="md"` on all states                                                      |
| Skeleton that covers only data rows but not toolbar or footer                            | Mirror the complete layout including toolbar and footer structural rows                           |
| Hardcoded skeleton row count that doesn't match the page size                            | Import the page-size constant; drive `Array.from({ length: PAGE_SIZE })` directly from it         |
| Skeleton bar `height={N}` (integer px) for a text row                                    | `height="calc(var(--mantine-font-size-sm) * 1.55)"` (or `xs` variant)                             |
| Sort icon on every sortable column header                                                | `return null` for inactive columns; directional icon only on the active column                    |
| `minWidth` on the scroll container `<div>` instead of on `<Table>`                       | Apply `style={{ minWidth }}` to `<Table>`, not to the wrapper `<div>`                             |
| A new component library installed alongside Mantine                                      | Mantine props, variants, CSS vars, and `factory()` only                                           |
| A new `packages/ui` export for a pattern used by only one consumer                       | Colocate in the consuming app until two distinct consumers exist (ADR-006)                        |
| Two props that always travel together (`isFetching` + `renderSkeletonRow`)               | One prop that carries both the state and the render fn; the prop's presence is the signal         |

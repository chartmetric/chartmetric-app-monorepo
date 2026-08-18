# Design Language

Chartmetric-specific design decisions for `apps/web/`. Every rule follows the pattern: **condition → Mantine API call → one-sentence why → exception if any.**

This document is the single source of truth for all verticals (athletes, music artists, creators, and any future entity type). Rules are derived from real implementation work and apply universally unless a section explicitly marks a rule as vertical-specific. `apps/web/AGENTS.md` and `packages/ui/AGENTS.md` carry short-form pointers; the `web-design-guidelines` skill prepends a read instruction. Do not duplicate rules across files.

## Vertical accent colors

Each vertical has one primary Mantine color that repeats across: taxonomy labels, row hover, and level badge tint. The color must carry semantic meaning at product level, not be arbitrary.

| Vertical          | Accent color        | Semantic meaning                                      |
| ----------------- | ------------------- | ----------------------------------------------------- |
| Athletes / sports | `teal`                                                     | Active, established, primary-positive |
| Music artists     | `teal`                                                     | Active, established, primary-positive |
| *(future)*        | `teal` until a distinct semantic meaning is established    | Add a row here with rationale before switching to a different color |

References to "the vertical's accent color" throughout this document mean: look up the current page's vertical in this table. All current verticals use `teal`.

---

## Color semantics

These are the semantic meanings of Mantine color names in this codebase. The meaning is fixed regardless of vertical — the same color must carry the same signal everywhere it appears.

| Color             | Semantic meaning                                                                      | Use for                                                              |
| ----------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `dimmed` / `gray` | Absent, unknown, or unclassified. Secondary text the user does NOT filter or sort on. | Unknown/fallback category; secondary metadata; social icon links     |
| `teal`            | Active, established, primary-positive. The shared accent color across all verticals.  | Row hover; "Pro" / top-tier level badge; taxonomy labels             |
| `orange`          | Rising, momentum-up, energetic.                                                       | Momentum-up indicator; high-energy category labels                   |
| `grape`           | Niche/specialist.                                                                     | Specialist category labels (e.g. racket sports, niche genres)        |
| `blue`            | Developmental, informational, aspirational.                                           | Verified badge; "College" / growth-tier badge                        |
| `red`             | Declining, momentum-down, error-adjacent.                                             | Momentum-down indicator; error states                                |
| `green`           | Positive/steady momentum.                                                             | Momentum-steady indicator                                            |

**Critical rule:** Never use `c="dimmed"` or `color="gray"` for a value the user can filter or sort on. Dimmed communicates "secondary/ignorable." Any category, level, or momentum dimension is a filter/sort axis — it must use semantic color.

**Adding a new color:** before using a Mantine color not listed above, add it to this table with a one-line semantic meaning. Never pick a color for aesthetics alone — it must carry the same meaning in every context it appears.

---

## Spacing

Two-tier system. **Mantine token strings** for structural/container-level spacing where breathing room is the goal. **Raw px integers** for intra-cell dense gaps where tighter control is needed and Mantine's smallest token (`xs` = 8px) is already too much.

### Container padding

Every structural chrome region uses consistent padding so the table edges stay visually aligned across all states (loading, empty, error, data):

| Region | Props | Why |
|---|---|---|
| Toolbar row | `px="md" py="xs"` | Medium horizontal keeps content clear of Paper edge; extra-small vertical keeps the toolbar compact above the table |
| Footer row | `px="md" py="sm"` | Same horizontal alignment as toolbar; slightly taller vertical because pagination controls need more touch target height |
| Empty / error state | `p="xl"` | Full padding on all sides — the state fills the Paper with nothing else competing for space |
| Page-level Stack | `gap="md"` | Medium vertical separation between filters, alerts, and the table card |

Skeleton toolbar and footer mirror these values exactly so the container dimensions don't change when data arrives.

### Table density

Set `verticalSpacing="md"` on `<Table>`, never per-row. This is the only spacing prop that controls row height — do not add `py` to `Table.Td` or override it per cell. The medium vertical spacing gives rows enough breathing room for a three-line identity cell without wasting space.

### Intra-cell gap scale

Inside a table cell, use raw px integers. Mantine's `xs` (8px) is the smallest token but is already too wide for tight icon+label pairs in a dense row.

| Value | Use case |
|---|---|
| `gap={2}` | Vertical spacing between lines in a multi-line Stack (identity cell text lines) |
| `gap={4}` | Horizontal spacing in compact icon+label or icon+icon pairs (momentum cell, social links, pill group label+items) |
| `gap={6}` | Horizontal spacing in a single-row label+badge or label+icon pair (name + verified icon, header label + sort icon, logo + name) |
| `gap="sm"` | Between a large element (avatar) and its accompanying text block — the larger visual mass needs more breathing room |
| `gap={0}` | Intentional zero gap: stacked primary/secondary text lines that should read as one unit (e.g. league name above league tier) |

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

1. **Taxonomy label** — any categorical dimension the user filters or sorts on, rendered inline in a dense data row (sport name, genre, content type, etc.):
   → `<Text c={getCategoryColor(item)} size="xs">` where `getCategoryColor` is the vertical's color-mapping function (e.g. `getSportColor`, `getGenreColor`).
   → **Never** `<Badge>` — Badge adds pill geometry (border-radius, padding) that misaligns text in dense rows and visually competes with row borders.

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
  <Avatar size={40} radius="xl" bd="1px solid var(--mantine-color-default-border)" />
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

- **Avatar:** `size={40}` (large enough for face recognition, small enough to let text drive row height). `radius="xl"` (round) for people; `radius="sm"` for organisations, teams, or brands. `bd="1px solid var(--mantine-color-default-border)"` — required when the image may be absent (initials fallback) or when the photo background matches the page background; the 1px ring uses the default border color and adapts to light/dark mode.
- **Stack gap:** `gap={2}` between all three lines.
- **Social row extra gap:** The social `<Group>` carries `mt={2}` in addition to the Stack `gap={2}`, giving 4px total before the social row. This matches the visual weight of the icon row versus text rows.
- **Line 1 height** (Text `size="sm"`, 14px): rendered line-height = `14 × 1.55 = 21.7px`.
- **Line 2 height** (CountryFlag is `Text size="sm"`, not `xs`): rendered line-height = 21.7px. The sport text (`size="xs"`) is shorter but the Group `align="center"` is driven by the taller flag — both are 21.7px.
- **Line 3 height** (Anchor `size="xs"`, 12px): rendered line-height = `12 × 1.55 = 18.6px`.

---

## Table loading states

### Two distinct states — do not conflate

| Trigger                                                               | State        | Correct pattern                                                                           |
| --------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `query.isPending` — no data exists yet                                | Initial load | Show the full skeleton (toolbar + table + footer)                                         |
| `query.isFetching && !query.isPending` — data exists, being refreshed | Refetch      | Replace body rows with the existing `SkeletonDataRow`; headers stay real                  |

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

1. **Skeleton toolbar** — `<Group justify="space-between" px="md" py="xs">` with placeholder bars at the same padding as the real toolbar. If absent, the skeleton card is shorter than the loaded card and jumps down when data arrives.
2. **Table body** — `<Table.ScrollContainer>` → `<Table>` → `<Thead>`/`<Tbody>` mirroring the real column widths.
3. **Skeleton footer** — `<Group justify="space-between" px="md" py="sm">` with placeholder bars at the same padding as the real footer. Same layout-shift risk if absent.

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
3. For each region: is it rendered while `isPending`? If not, add a placeholder with matching `px`/`py` padding.
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
| Hardcoded skeleton row count that doesn't match the page size                            | Import the page-size constant; drive `Array.from({ length: PAGE_SIZE })` directly from it        |
| Skeleton bar `height={N}` (integer px) for a text row                                    | `height="calc(var(--mantine-font-size-sm) * 1.55)"` (or `xs` variant)                             |
| Sort icon on every sortable column header                                                | `return null` for inactive columns; directional icon only on the active column                    |
| `minWidth` on the scroll container `<div>` instead of on `<Table>`                       | Apply `style={{ minWidth }}` to `<Table>`, not to the wrapper `<div>`                             |
| A new component library installed alongside Mantine                                      | Mantine props, variants, CSS vars, and `factory()` only                                           |
| A new `packages/ui` export for a pattern used by only one consumer                       | Colocate in the consuming app until two distinct consumers exist (ADR-006)                        |

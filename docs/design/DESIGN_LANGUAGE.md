# Design Language

Chartmetric-specific design decisions for `apps/web/`. Every rule follows the pattern: **condition → Mantine API call → one-sentence why → exception if any.**

This document is the single source of truth. `apps/web/AGENTS.md` and `packages/ui/AGENTS.md` carry short-form pointers; the `web-design-guidelines` skill prepends a read instruction. Do not duplicate rules across files.

Derived from the athletes page implementation (`phases/01-athletes-page-design`). All rules reflect code as shipped, not as planned.

---

## Color semantics

These are the semantic meanings of Mantine color names in this codebase. Only colors that appear in production code are listed.

| Color             | Semantic meaning                                                                            | Where used                                                             |
| ----------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dimmed` / `gray` | Absent, unknown, or unclassified. Also: secondary text the user does NOT filter or sort on. | Fallback sport color; secondary metadata                               |
| `teal`            | Active, established, primary-positive. The sports-vertical accent color.                    | Football/Soccer sport label; row hover; Pro level badge                |
| `orange`          | Rising, momentum-up, energetic.                                                             | Basketball sport label; momentum-up indicator                          |
| `grape`           | Tennis.                                                                                     | Tennis sport label                                                     |
| `blue`            | Developmental, informational, aspirational.                                                 | Verified badge; College level badge                                    |
| `red`             | Declining, momentum-down, error-adjacent.                                                   | Momentum-down indicator                                                |
| `green`           | Positive/steady momentum.                                                                   | Momentum-steady indicator (check `MomentumCell.tsx` for exact mapping) |

**Critical rule:** Never use `c="dimmed"` or `color="gray"` for a value the user can filter or sort on. Dimmed communicates "secondary/ignorable." Sport name, level, and momentum are all filter/sort dimensions — they must use semantic color.

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

1. **Sport name, genre, or other taxonomy label** (a dimension the user filters or sorts on, rendered inline in a dense data row):
   → `<Text c={getSportColor(sport)} size="xs">` (or equivalent color function)
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

The three-line hierarchy for entity identity cells in a data table, as implemented in `AthleteIdentity.tsx`:

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

| Trigger                                                               | State        | Correct pattern                            |
| --------------------------------------------------------------------- | ------------ | ------------------------------------------ |
| `query.isPending` — no data exists yet                                | Initial load | Show `<AthleteListLoading>` skeleton       |
| `query.isFetching && !query.isPending` — data exists, being refreshed | Refetch      | Show `<LoadingOverlay>` over existing rows |

Swapping these degrades UX: a skeleton on refetch destroys layout stability; an overlay on initial load shows a blank sheet with a spinner that teaches nothing about the incoming layout.

### Skeleton structure rules

**The skeleton must mirror the complete loaded layout — every missing structural element causes a layout shift on transition.**

For `AthletesTable`, the skeleton (`AthleteListLoading.tsx`) must contain:

1. **Skeleton toolbar** — `<Group justify="space-between" px="md" py="xs">` with placeholder bars at the same padding as `TableToolbar`. If this row is absent from the skeleton, the card starts higher than the loaded card and jumps down when data arrives.
2. **Table body** — `<Table.ScrollContainer>` → `<Table>` → `<Thead>`/`<Tbody>` mirroring the real column widths.
3. **Skeleton footer** — `<Group justify="space-between" px="md" py="sm">` with placeholder bars at the same padding as `TableFooter`. Same layout-shift risk if absent.

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

1. Identify every structural region of the loaded component (header, toolbar, table, footer, pagination).
2. For each region: is it rendered while `isPending`? If not, add a placeholder with matching `px`/`py` padding.
3. Confirm bar heights use the CSS variable formula, not integer px.
4. Confirm avatar placeholder uses `<Skeleton circle height={avatarSize}>` (not a rectangle).

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
// In AthletesTable.tsx — set on the Paper wrapper, not on DataTable
const TEAL_HOVER_STYLE = {
  "--table-highlight-on-hover-color": "var(--mantine-color-teal-light)",
} as const;

<Paper shadow="sm" radius="md" style={TEAL_HOVER_STYLE}>
  <DataTable ... />
</Paper>
```

**Why:** `var(--mantine-color-teal-light)` is Mantine's computed soft teal wash (very subtle in light mode, dark-teal tint in dark mode). It repeats the sports accent color on every row hover, reinforcing the vertical's identity at zero extra DOM cost.

**Rules:**

- Set it on the nearest Paper ancestor, not on `DataTable` (shared component — its default should stay neutral).
- Future verticals use their own accent: music → `var(--mantine-color-blue-light)`, etc.
- Sticky cells in `DataTable.module.css` inherit this variable in their `tr:hover` rule to maintain consistent hover appearance across frozen and scrollable columns.

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

| Anti-pattern                                                               | Correct alternative                                                                          |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `c="dimmed"` or `color="gray"` for sport name or any filter/sort dimension | `c={getSportColor(sport)}` or the appropriate semantic color                                 |
| `<Badge variant="dot">` inside a dense table cell                          | `<Text c={color} size="xs">` for taxonomy labels; `<Badge variant="light">` for status/level |
| Unicode directional characters (`▲ ▼ — ↑ ↓`)                               | FA icons from `@fortawesome/pro-solid-svg-icons`, imported individually by path              |
| `<Paper withBorder>` on a plain page background                            | `<Paper shadow="sm" radius="md">`                                                            |
| Different Paper variants across state siblings (loading/empty/error/data)  | Same `shadow="sm" radius="md"` on all states                                                 |
| Skeleton that covers only data rows but not toolbar or footer              | Mirror the complete layout including toolbar and footer structural rows                      |
| Skeleton bar `height={N}` (integer px) for a text row                      | `height="calc(var(--mantine-font-size-sm) * 1.55)"` (or `xs` variant)                        |
| Sort icon on every sortable column header                                  | `return null` for inactive columns; directional icon only on the active column               |
| `minWidth` on the scroll container `<div>` instead of on `<Table>`         | Apply `style={{ minWidth }}` to `<Table>`, not to the wrapper `<div>`                        |
| A new component library installed alongside Mantine                        | Mantine props, variants, CSS vars, and `factory()` only                                      |
| A new `packages/ui` export for a pattern used by only one consumer         | Colocate in the consuming app until two distinct consumers exist (ADR-006)                   |

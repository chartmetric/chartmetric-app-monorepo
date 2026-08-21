# Design Language — Visual System Rules

The cross-cutting visual system: color, state, contrast, type, spacing, surfaces. Each rule states its condition, the Mantine/`@repo/ui` API it maps to, and one sentence of why; exceptions are inline. When a number and a token disagree, the token wins.

_Part of the [Design Language](DESIGN_LANGUAGE.md). Read the [index](DESIGN_LANGUAGE.md) for the map and reading order._

## Vertical accent colors

Each vertical has one primary Mantine color that repeats across: taxonomy labels, row hover, and level badge tint. The color must carry semantic meaning at product level, not be arbitrary.

| Vertical          | Accent color                                            | Semantic meaning                                                    |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Athletes / sports | `teal`                                                  | Active, established, primary-positive                               |
| Music artists     | `teal`                                                  | Active, established, primary-positive                               |
| _(future)_        | `teal` until a distinct semantic meaning is established | Add a row here with rationale before switching to a different color |

References to "the vertical's accent color" anywhere in the design language mean: look up the current page's vertical in this table. All current verticals use `teal`.

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

**The accent is ink, not neon.** `teal.9` (owner: theme) fills selected controls and the nav rail; the content area stays achromatic. Brighter teal steps are for hovers and links only. **Dark mode is near-black:** `colors.dark` is a teal-tinged near-black scale (owner: theme) — never lighten it per surface.

**Chips are soft fills, never wiry outlines.** Athlete chips: soft gray fill, hairline border, gray ink. Tags on catalog rows: soft fill, no border, dark ink.

**Dividers whisper; the header row encloses.** Row dividers sit at the faintest gray step (theme `Table` vars); the header row's top and bottom borders sit one step darker than the dividers.

## Interactive state and tone

**A state change is one step on the scale, never a leap.** Hover, selected, pressed, and focus states — and the light/dark washes behind tags, chips, and rows — shift the resting color **one notch** up or down the same scale. A bright teal wash on a white row, or any hue jump for a mere hover, reads as _selection_ or an error, not as an affordance. The [Row hover](rules-components.md#row-hover) rule is the canonical instance of this: gray in light mode, the accent `-light` wash only in dark mode where gray steps vanish against near-black.

Apply the same one-notch discipline everywhere an element changes appearance in response to state or mode:

- **Light-mode interactive states are gray**, not colorful; the colored wash survives only in dark mode.
- A selected control moves to the accent ink, not to a brighter saturated fill than its neighbors.
- Tag and chip hovers move one gray step, matching the row-hover treatment.

If a state change is visible from across the room, it is too big.

## Accessibility and contrast

Legibility is a design requirement, not a QA afterthought. Every text/background and icon/background pair must be readable in **both** color schemes.

- **Contrast floor: WCAG 2.2 AA.** Normal text ≥ 4.5:1 against its actual background; large text (≥ 18.66px bold or ≥ 24px) and meaningful UI components/icons ≥ 3:1. Use **APCA** (the perceptually-accurate method) when tuning close calls or judging text on colored fills — AA is the floor, APCA is the finer instrument. See [Sources](DESIGN_LANGUAGE.md#sources).
- **Contrast is measured against the _actual_ fill, not the page.** A button label's contrast is against the button color; a badge's ink is against the badge fill; washed rows and chips are checked against their washed background, not white. Black text on a dark-gray button fails — pick the label color for the fill it sits on. This is the most common contrast defect and it is invisible until measured.
- **Semantic color still has to pass.** When [Color semantics](#color-semantics) assigns a hue, choose the step that both carries the meaning and clears the floor against its background in both schemes. Meaning does not exempt a value from contrast.
- **Color is never the only signal.** Momentum uses an icon _and_ color; a status uses a label _and_ a tint. A red/green distinction must survive color-blindness and grayscale.
- **Interactive elements are reachable and announced.** Keyboard focus is visible (never `outline: none` without a replacement); controls expose role and state (`aria-sort` on sortable `<th>`, `aria-disabled` on inert buttons, `aria-hidden` on decorative icons with the meaning carried in adjacent text). Verify the rendered DOM role, not the prop name — see [Mantine mechanics](rules-components.md#mantine-mechanics).
- **Verify in both schemes at the reference width** before calling a visual change done (see [Method](method.md#running-the-parity-loop)). A future CI contrast lint is planned (`apca-w3`); until then, measure by hand.

## Typography

- **Two typefaces, both theme-owned.** Inter Variable for UI chrome; Space Mono (the theme `fontFamilyMonospace`) as the data face for table cells, counts, and metric values — reached only via `ff="monospace"`, never by naming the family. Do not add any further font package.
- **Numeric columns render through `@repo/ui/numeric-cell`.** The mono data face carries fixed-width digits inherently, so numbers never shift as values change; `NumericCell` adds the ink classes and the optional leading pictogram. No per-cell `tabular-nums` styling. Numbers share the exact text size of neighbouring text cells and right-align, lining up digit-for-digit down the column.
- **Hierarchy comes from weight, case, and color — not size inflation.** Inside a dense region, a section or metadata label is `<Text size="xs" tt="uppercase" c="dimmed">` (no positive letter-spacing), not a bigger heading. (`c="dimmed"` is correct here: a section label is not a filter/sort value.) Reserve theme heading sizes for page and view titles.
- **Size hierarchy follows importance.** An identity name outranks its tag in size — name one token above the tag — not only in weight. A tag rendering larger than the name it annotates is an inversion, however correct the weights are.
- **Peer columns share one type scale.** Cells that sit side by side in the same row band use the same Mantine text size; a column whose text is visibly larger than its neighbours reads as emphasis the data does not justify. When two columns genuinely need different weights, vary `fw` or color, not `size`. A numeric column is never an exception to this.
- **Bold belongs to the page title alone.** One bold element per page: identity names are medium (500) mono, headers 500, data 400, and all buttons 400 (the `Button` theme styles own this — filter pills, sort menus, and chrome buttons never carry weight). Emphasis beyond the title comes from ink or size bands, not weight.
- **Ink lives in narrow bands.** Data ink is the theme `black` (a soft near-black, never harder); label ink one step lighter (`gray-7`/`dark-2` band); list text dimmed; overflow counts lighter still. Headers carry no positive letter-spacing.
- **Section dividers recede.** Nav group headers (LIBRARY / DISCOVER / TOOLS) and taglines are dimmed translucent white on the rail — they call _less_ attention than the items they group. A divider brighter than its tabs has the hierarchy backwards.
- **Space Mono needs negative tracking.** Its letterforms are wide: at equal font-size it reads a size larger and "letterspaced" versus narrower monos. The compensation (negative `letterSpacing` on the mono face) lives on the typeface as props-conditional theme styles (`ff="monospace"` → tightened tracking) — never per call site.

The `fontSizes`, `lineHeights`, and `headings` scales are owned by `packages/ui/theme/theme.ts` and set by iteration against the reference prototype. That file is the only source for sizes; skeleton bars derive from `var(--mantine-font-size-*) * var(--mantine-line-height-*)` so they track every retune automatically. A surface that looks oversized means a local override, not a token change.

## Spacing and table density

Two-tier system. **Mantine token strings** for structural/container-level spacing where breathing room is the goal. **Raw px integers** for intra-cell dense gaps where tighter control is needed and Mantine's smallest token (`xs` = 8px) is already too much. All values are owned by the theme and the `@repo/ui/data-table` constants; do not restate them per page.

### Container padding

Every structural chrome region uses consistent padding so the table edges stay visually aligned across all states (loading, empty, error, data):

| Region              | Props             | Why                                                                                                               |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Toolbar row         | `px="md" py={4}`  | Medium horizontal keeps content clear of Paper edge; 4px vertical keeps the sort summary a caption, not a band    |
| Footer row          | `px="md" py="xs"` | Same horizontal alignment as toolbar; slightly taller vertical because pagination controls need more touch height |
| Empty / error state | `p="xl"`          | Full padding on all sides — the state fills the Paper with nothing else competing for space                       |
| Page-level Stack    | `gap="md"`        | Medium vertical separation between filters, alerts, and the table card                                            |

Do not restate these paddings. `@repo/ui/data-table` exports `TABLE_TOOLBAR_PADDING` and `TABLE_FOOTER_PADDING`; the real toolbar, the real footer, and the skeleton that stands in for both spread the same object, so container dimensions cannot drift between states.

### Table density

`DataTable` owns row height: it applies the exported `TABLE_VERTICAL_SPACING` (`"sm"`) to its `<Table>`, and a skeleton's `<Table>` imports the same constant. Never pass `verticalSpacing` per page and never add `py` to `Table.Td` or override it per cell. The product is data-dense — the reference tables read correctly at what a looser scale showed at 80% zoom — and `sm` still clears a three-line identity cell. Controls default to the compact `xs` tier and the nav rail width is fixed — both owned by the theme; read the current values there.

### Intra-cell gap scale

Inside a table cell, use raw px integers.

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

`miw={0}` overrides flexbox's default `min-width: auto`, which otherwise prevents a flex child from shrinking below its content width. Apply it to every `Stack`/`Group` that sits inside a flex container and contains truncatable text.

### Column width and wrapping lists

- **A table's flexible column is a design decision.** Fixed-width columns push all slack into whichever column has only a `minWidth`; know which column that is and make it the one whose content benefits (the wrapping list column), not whichever happened to be declared flexible. Probe with `getBoundingClientRect`, not by eye. Apply `style={{ minWidth }}` to the `<Table>`, never to the scroll-container `<div>`.
- **Wrapping list columns wrap whole items.** Multi-word entries are internally no-break-bound ("Costa Rica" never splits), the +N count is glued to the last item with a no-break space, the preview count is budgeted so the clamp never produces an ellipsis, and the +N reads lighter than its list.
- **Distribute row width by content:** identity columns get fixed widths, list columns (chips, nationality lists) flex, numeric metric columns get compact fixed widths at the right edge.

### Social/action row separation

The social icon row inside an identity cell uses `mt={2}` in addition to the parent Stack's `gap={2}`, giving 4px total above the social row. This marks the boundary between informational lines (name, category) and actionable links (platform icons) without a divider.

## Surface hierarchy

**Data tables and their state siblings:** Use `<Paper shadow="sm" radius="md">` without `withBorder` when the Paper sits on a plain page background (gray-0 or page default). `withBorder` adds a hard 1px edge that reads as a panel boundary and competes with the table's own row dividers; `shadow="sm"` achieves lift at lower contrast cost.

**Critical rule for state siblings:** Loading skeleton, data table, empty state, and error state all use the **same Paper props** (`shadow="sm" radius="md"`). If one state uses `withBorder` and another uses `shadow`, the page appears to change containers on transition.

**Exception:** Use `withBorder` when the Paper is nested inside another elevated container (modal, drawer, another Paper with shadow). Shadow-on-shadow reads as floating; a border gives a definite edge.

**Form inputs and filter controls:** Use `withBorder`. Controls need a definite, clickable edge.

**Never use both** `shadow` and `withBorder` on the same element.

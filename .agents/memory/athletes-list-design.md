---
name: Athletes list page design principles
description: Design decisions, patterns, and reference-implementation gaps found during the athletes page overhaul. Source material for phase 02 design-language doc and skill.
---

# Athletes list page — design learnings

## Reference implementation (attached_assets/image_1787010762112.png)

Dark theme. The reference is another Chartmetric product. Key observations:

### Identity cell

- **Avatar**: round, ~48 px, no visible border ring in dark mode
- **Line 1**: Athlete name (semibold) + verification checkmark (blue) inline
- **Line 2**: Country flag emoji + sport name in a **sport-specific color** (not dimmed)
- **Line 3**: Social platform icon row (TikTok, Instagram, X) directly below

### Sport-specific color mapping

Sport name drives text color. Reference colors (Mantine equivalents):

- Football / Soccer → `teal`
- Basketball → `orange`
- Tennis → `grape`
- Baseball → `blue`
- Default / unknown → `dimmed`

**Why:** Sport is a primary filter axis, not secondary metadata. Color makes it scannable; `c="dimmed"` buries it visually. The same color should appear anywhere the sport is displayed (filter chips, badges, cell text).

### Column headers — platform grouping

Social metric columns use a two-line header pattern:

- **Secondary label** (small, dimmed): platform name — "TikTok", "Instagram"
- **Primary label** (normal weight): metric name — "Followers", "Likes", "Posts"

This groups related columns visually without adding separate header groups. DataTable already supports `secondaryLabel` — wire it up for all social metric columns.

### Loading skeleton

- Must mirror the DataTable DOM exactly: `Paper → Table.ScrollContainer → Table → Thead/Tbody`
- Header row with skeleton bars proportioned to column widths
- 8 body rows; athlete column shows circle (avatar) + two text lines
- `variant="dot"` Badge is wrong for inline sport labels in table cells — causes misaligned text and visual noise
- Full-width stacked `<Skeleton>` rows with no column structure are wrong — they give no information about the layout

### Row hover / selection

- Selected / hovered row uses a teal background strip (matches sport accent or global accent)
- Mantine `Table highlightOnHover` gives a generic gray; a custom CSS var or `--mantine-color-default-hover` override would match the reference

### Filter bar structure (reference)

Two rows below the global search:

1. **Filter dropdowns**: Search text input, Sport, League, Team, Nation
2. **Quick-filter chips**: LEVEL (Professional / College), IG follower tier (100M+ / 10M+ / 1M+ / <1M), Verified toggle, "+ More"

The filter chips replace individual dropdowns for boolean/enum dimensions that have ≤5 values.

### Controls row

Right-aligned: Columns picker button + SORT button + current sort label. No page title visible — the global nav provides context.

## Mistakes to avoid

- Do NOT use `Badge variant="dot"` for sport labels in dense table cells — text is not vertically centered and the dot adds noise.
- Do NOT render five full-width `<Skeleton>` bars as a loading state — they give zero layout signal.
- Do NOT use `c="dimmed"` for sport name — the sport is a meaningful, scannable dimension.
- Do NOT bypass the harness write loop to implement phases directly as main agent.

## Patterns that work

- `secondaryLabel` on DataTableColumn for platform header grouping — already in the codebase, wire it up.
- `getSportColor(sport: string | null): MantineColor` pure function — returns the color for any sport string, defaulting to "dimmed" for unknowns.
- `Stack gap={2}` on the identity cell inner stack — tighter than `gap={0}` (too cramped) and `gap={4}` (too loose).

## Principle: Badge is for status, not inline taxonomy labels

**What:** `Badge variant="dot"` was used for the sport label in the identity cell. It was replaced with `<Text c={getSportColor(sport)} size="xs">`.

**Why:** `Badge` is a contained pill — it communicates "this value has a STATUS or CATEGORY that benefits from visual encapsulation." In a dense data row it adds border-radius geometry, a dot indicator, and misaligned text. Inline taxonomy labels (sport, nationality, genre) are _dimensions_ not _statuses_ — they live as colored text, not pills.

**How to apply:**

- Use `Badge variant="light"` for statuses with 2–4 discrete values where containment helps (Level: Pro/College, Momentum: Hot/Steady/Cold).
- Use `Badge variant="outline"` for user-applied tags or filters shown inline.
- Use colored `Text` for taxonomy dimensions that appear as secondary info in a data row (sport, nationality, genre).
- Never use `Badge variant="dot"` inside a table cell — the dot indicator is for list items and menu entries, not data cells.

---

## Principle: data containers use shadow, not border

**What:** `Paper withBorder` → `Paper shadow="sm"` on the athletes table card.

**Why:** A border rule drawn around a data table adds a line that visually competes with the table's own row dividers. The eye can't tell whether the outer rectangle is "the edge of the card" or "a header row separator." A shadow lifts the card as a unit without introducing geometry that conflicts with interior structure.

**How to apply:**

- Data containers (tables, lists, charts): `shadow="sm"` or `shadow="xs"`.
- Form inputs, filter dropdowns, interactive controls: `withBorder` — these need a definite edge to signal "click target."
- Never use both on the same element.

---

## Principle: icon system consistency — no unicode direction indicators

**What:** `▲▼—` in `MomentumCell` replaced with `faArrowUp` / `faArrowDown` / `faMinus` from FontAwesome.

**Why:** Unicode directional characters (▲▼—↑↓) fail on three counts:

1. **Size**: they scale with font-size, not with the icon grid — they look wrong at `xs` or `xl`.
2. **Color**: you can't tint a unicode character with Mantine's `c` prop reliably across browsers.
3. **Accessibility**: screen readers announce them as "black up-pointing triangle" — meaningless in context. FA icons get `aria-hidden` with a label provided by surrounding text.

**How to apply:** Every directional, status, or platform indicator on the page must come from the FA icon set. If a suitable FA icon doesn't exist, use a Mantine `ThemeIcon` or a text label — never a raw unicode symbol.

---

## Principle: avatar presentation in data table rows

**What:** `Avatar size={40} radius="xl" bd="1px solid var(--mantine-color-default-border)"` in the identity cell.

**Why:**

- **40 px**: large enough for the face to be recognisable; small enough that the row height is driven by the text alongside it, not the avatar. 48 px (the reference) inflates row height noticeably — 40 px is the right balance for a dense list.
- **`radius="xl"` (round)**: round avatars signal _people_. Square or rounded-square avatars signal _organisations, clubs, brands_. Use round for athlete/artist identity cells; use `radius="sm"` for club/team cells.
- **`bd` border ring**: when an avatar has no photo (initials fallback) or the photo background matches the table background, the avatar becomes invisible without a thin ring. The ring costs nothing visually — it's 1 px and uses the default border color which adapts to light/dark mode.

---

## Principle: LoadingOverlay and skeleton solve different problems

**What:** `LoadingOverlay` is on `AthletesTable` (data exists, being refreshed). `AthleteListLoading` skeleton is shown when `query.isPending` (no data yet).

**Why:** These are two distinct user states:

- **Initial load** (`isPending`): the user has no mental model of the content yet. Show a skeleton that teaches them the layout — column structure, row density, cell types — before data arrives.
- **Refetch / filter change** (`isFetching && !isPending`): the user already knows what the list looks like. Show a `LoadingOverlay` over the existing rows so the layout stays stable and they know "the same thing is here, just updating."

Swapping these degrades UX in both directions: a skeleton on refetch destroys layout stability; an overlay on initial load shows a blank sheet with a spinner that teaches nothing.

**How to apply:** Any data list needs both: a skeleton for `isPending` and a `LoadingOverlay` (or `opacity` transition) for `isFetching && !isPending`.

---

## Principle: skeleton = layout promise, not placeholder rectangle

**What:** Five full-width `<Skeleton>` bars in a `<Stack>` replaced with a proper `Table.ScrollContainer → Table → Thead/Tbody` skeleton with column-proportioned cells.

**Why:** A skeleton tells the user what is about to appear. Five equal-width bars say "five equal-width things are coming" — they teach the wrong layout. A table skeleton must mirror the actual DOM:

- Same container (`Paper`, `ScrollContainer`)
- Header row with skeleton bars at each column's real width/minWidth
- Body rows with cells sized to feel like real data values (narrow for rank numbers, wide for names, medium for metrics)
- Identity cell: avatar circle + two text lines (name + sport/flag)

**How to apply:**

1. Build the skeleton in the same component tree as the real component — they should look nearly identical structurally.
2. Column widths in the skeleton must match the `width` / `minWidth` values from the real column definitions.
3. Skeleton bar widths within cells should feel like real content (not 100% — rank is ~24 px not 64 px).
4. The athlete identity skeleton shows `Skeleton circle` for the avatar so the proportions match.

---

## Principle: two-line platform column headers via `secondaryLabel`

**What:** `DataTableColumn.secondaryLabel` is set to `"TikTok"` or `"Instagram"` for all social metric columns, rendering a small dimmed platform label above the metric name.

**Why:** When a table has multiple columns from the same source (TikTok Followers, TikTok Likes, TikTok Posts), showing just the metric name orphans the columns — the user has to read the full group to know they're all TikTok. The `secondaryLabel` pattern groups them visually at zero DOM cost: no separate header group row, no colspan, no extra component.

**How to apply:** Whenever a set of columns shares a source (platform, category, time period), use `secondaryLabel` for the shared prefix and keep `label` as the unique metric name. The `DataTable` component already renders this — just populate the field.

---

## Principle: icon-row gap is tighter than text-row gap

**What:** `SocialLinks` gap changed from 6 → 4 px.

**Why:** Icon-only rows (no text labels) have more natural whitespace inside each icon's SVG viewbox. A gap of 6 px between icons creates more visual separation than 6 px between text characters — the same number looks wider. 4 px between social icons is optically equivalent to 6–8 px between text words.

**How to apply:** Icon-only groups: `gap={4}`. Icon + label groups: `gap={6}`. Text-only groups: follow the Mantine default (`gap="xs"` or `gap="sm"`).

---

## Principle: row hover color = product accent, not OS default

**What:** Override `--table-highlight-on-hover-color` with `var(--mantine-color-teal-light)` on the table's Paper wrapper instead of accepting Mantine's default `gray-1` / `dark-5`.

**Why it matters:**

1. **Brand signal at zero cost.** Every row hover repeats the teal accent — the user's eye learns "teal = sports/athletes" without any extra UI element. Generic gray says "you can click this"; teal says "this is a Chartmetric sports product."
2. **Context-continuity.** Teal already appears in Football sport labels, the Pro level badge, and action buttons. The hover closing that loop means all interactive surfaces share one accent — cohesion across the whole page without any new color introduced.
3. **Dark mode legibility.** Generic light-gray hover (`dark-5`) reads ambiguously in dark UI — it can look like a selected state or even text. A colored teal tint is unambiguously "pointer is here."
4. **Adaptive by nature.** `--mantine-color-teal-light` is Mantine's computed light-variant for teal: very soft teal wash in light mode, subtle dark-teal tint in dark mode. The reference screenshot (dark mode) shows exactly this: a near-black teal strip that doesn't compete with cell content.

**How to apply:** Set `--table-highlight-on-hover-color` on the closest Paper ancestor of the DataTable. Never set it on the DataTable itself (it's a shared component). Sticky cells in DataTable.module.css must read this variable before falling back to `--table-hover-color` — keep that cascade in `tr:hover .stickyCell`.

**Scope:** Athletes table uses teal. If a future vertical has a different accent (e.g. music = blue), apply the same pattern with that vertical's `--mantine-color-<accent>-light`. Do not change the shared DataTable component's default.

## Phase 02 scope

Phase 02 is a design-language doc / skill. It should codify:

1. Sport color palette (the `getSportColor` mapping with rationale)
2. Two-line header convention for platform-grouped columns
3. Table skeleton structure rules (mirror DOM, column-proportioned, 8 rows)
4. Identity cell composition rules (avatar size, line structure, social row)
5. When to use Badge vs Text vs colored Text in data cells
6. LoadingOverlay (subsequent fetch) vs table skeleton (initial load) distinction

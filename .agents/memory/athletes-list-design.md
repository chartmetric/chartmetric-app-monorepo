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

## Principle: controls that affect a view belong inside the card they control

**What:** The `AthleteColumnPicker` was a standalone `<Group justify="flex-end">` row floating between the filter bar and the table. It was moved into `AthletesTable` as a `toolbar` prop rendered inside the Paper, above the DataTable.

**Why:** A control that orphans itself above its target creates two problems:

1. **Visual disconnection** — the user has to scan between "the button up there" and "the table down there" to understand what the button controls. When the control is inside the card, pointing is self-evident.
2. **Wasted vertical space** — a single-item row with `justify="flex-end"` burns a full line height plus two gap units just to position one button. Inside the Paper it adds zero extra height — it shares the card's existing padding.

**How to apply:** Any control that modifies the structure or columns of a data view (column picker, density toggle, grouping control) should live inside the data card's Paper. Co-locate it in the footer row alongside the row-count text and pagination — no dedicated toolbar row unless there are ≥2 controls that together fill the row meaningfully. A single right-aligned button in an otherwise empty row is worse than no dedicated row at all — it signals empty space, not intentional layout. Controls that modify the _data_ (filters, search, sort) stay outside the card — they are upstream of the view, not part of it.

---

## Principle: page title is redundant when global nav provides context

**What:** `AthletesHeader` (h1 "Athletes" + subtitle "Explore active athletes across sports.") was removed from `AthletesPage`.

**Why:** The global navigation — sidebar, breadcrumb, tab bar — already tells the user where they are. Adding an h1 inside the content area doubles the context signal and costs two line-heights at the most valuable real estate on the page (top of the viewport). The reference implementation has no visible page title in the content area for the athletes list.

**How to apply:**

- Omit the page title in content areas where the sidebar/nav tab is already labelled with the same noun.
- Keep a page title (`<Title>`) only on detail pages, settings pages, or any page without clear navigation-level context (e.g. a standalone onboarding page).
- The subtitle ("Explore active athletes…") is doubly redundant — the list itself is the explanation.

---

## Principle: section gaps should reflect logical distance, not visual decoration

**What:** `Stack gap="lg"` between every section in `AthletesPage` was reduced to `gap="md"`. The standalone column picker row was eliminated entirely.

**Why:** `gap="lg"` between the filter bar and the data table implies they are loosely related — two separate things. They are not: the filter bar IS the query that produces the table. Tight `gap="md"` communicates "this filter produces this result immediately below." Using the same large gap for every section flattens the information hierarchy and makes every section feel equally disconnected from every other.

**How to apply:**

- `gap="xl"` / `gap="lg"`: between page-level sections with different purposes (nav → page header → content).
- `gap="md"`: between a filter/control surface and the result it governs.
- `gap="sm"` / `gap="xs"`: within a card between related sub-elements.
- Never use the same gap value for the entire page `Stack` — the spacing should encode the logical relationships.

---

## Principle: empty and error states use the same elevation as the data state

**What:** `AthleteListEmpty` used `withBorder` while `AthletesTable` uses `shadow="sm"`. Fixed to `shadow="sm"`.

**Why:** The empty state occupies the same visual slot as the data table — it's not a different thing, it's the same card in a different state. Using a different elevation (`withBorder` vs `shadow`) makes the page feel like it _changed containers_ when it emptied. The user's eye notices the border appearing where there was a shadow. All states (loading skeleton, data table, empty, error alert) should feel visually consistent in their outer container.

**How to apply:** When defining states (loading, empty, error, data) for a list or table, set the same `Paper` props across all of them. The skeleton `AthleteListLoading` already uses `shadow="sm"`. The empty state now matches.

---

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

## Principle: reset actions must have a fixed, predictable position — never flex-end on a wrapping row

**What:** `FilterBar` outer Group used `align="flex-end"`, so "Clear filters" aligned to the _bottom_ of the inner filter Group. When the inner Group wrapped to 2 rows, "Clear filters" drifted to the right of the last row instead of staying top-right.

**Why:** Users expect "Clear filters" (and any destructive/reset action) at a consistent, findable location — always top-right of the filter card. `align="flex-end"` in a flex row means "align to the bottom of the cross axis of this row." When the sibling has wrapped content and grown taller, the button floats to the bottom of the multi-row block — a completely different visual position depending on how many filters are active.

**The fix:** `align="flex-start"` on the outer Group + `wrap="nowrap"` so the button stays pinned to the top-right corner regardless of how many filter rows the inner Group wraps to.

**How to apply:**

- Any action button (Clear, Reset, Apply) that sits alongside a wrapping filter group must use `align="flex-start"` on the outer flex container, with `wrap="nowrap"` so the button cannot itself wrap.
- Never use `align="flex-end"` on the outer container when the inner content can wrap — the button's position becomes unpredictable.

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

## Principle: sticky column header background must be uniform across the full header row

**What:** In the screenshot, the sticky columns (Rank, Athlete) show a teal/dark-teal header background, but the non-sticky column headers (Nationality, Age, Last game) show the plain dark background. This creates a two-tone header — half colored, half not — that looks broken rather than intentional.

**Why:** The header row is one visual band. When its left portion (sticky area) has a different background than its right portion (scrollable area), the header appears "split" — it reads as two separate UI regions rather than one row of column labels. The accent color on only the sticky portion is a CSS artifact (the sticky header background being set without extending it across the full row), not a design intent.

**How to apply:**
- The `thead tr th` background for sticky cells and non-sticky cells must use the same value.
- If a sticky cell needs a background to prevent content bleeding through during horizontal scroll, set that background on ALL `thead th` cells (via a shared CSS variable or class), not only the sticky ones.
- The visual distinction between sticky and scrollable columns in the header should come from the **scroll-state shadow** (see next principle), not from differing background colors.

---

## Principle: sticky columns communicate their frozen state via a scroll-shadow, not a background color difference

**What:** When the user scrolls a wide table horizontally, the sticky columns (Rank, Athlete) remain fixed while other columns pass beneath them. Without a visual cue, the boundary between fixed and scrolling content is invisible. The correct cue is a subtle shadow or right-edge fade on the sticky columns that appears **only when the table is scrolled** (i.e. when there is scrolled-under content).

**Why:** A persistent background color difference (always visible, regardless of scroll position) creates the two-tone header problem above. A scroll-state shadow appears only when it is meaningful — when content is actually passing under the sticky columns — so it carries semantic weight: "there is content hidden to the left under here." When the table is at its leftmost position, no shadow is needed and none should appear.

**How to apply:**
- Use a CSS `box-shadow` or `::after` pseudo-element on sticky cells that is only visible when the scroll container is not at its leftmost position.
- The standard implementation: a `box-shadow: inset -8px 0 8px -8px rgba(0,0,0,0.3)` on the right edge of the rightmost sticky cell, toggled via a scroll-position class on the scroll container.
- In Mantine's `Table.ScrollContainer`, this can be achieved by listening to the container's `scroll` event and toggling a CSS class that enables the shadow rule.
- The shadow should be subtle in light mode and slightly stronger in dark mode (where there is less contrast between the card background and the shadow).

---

## Phase 02 scope

Phase 02 is a design-language doc / skill. It should codify:

1. Sport color palette (the `getSportColor` mapping with rationale)
2. Two-line header convention for platform-grouped columns
3. Table skeleton structure rules (mirror DOM, column-proportioned, 8 rows)
4. Identity cell composition rules (avatar size, line structure, social row)
5. When to use Badge vs Text vs colored Text in data cells
6. LoadingOverlay (subsequent fetch) vs table skeleton (initial load) distinction

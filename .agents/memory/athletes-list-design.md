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

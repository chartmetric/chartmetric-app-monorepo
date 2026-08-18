# Phase 02 — Design language documentation

## Goal

Phase 01 established concrete design decisions for the athletes page using Mantine's style system. This phase turns those decisions into durable, agent-executable documentation so future agents apply the same design intelligence without reconstructing it. The output is a canonical `docs/design/DESIGN_LANGUAGE.md` plus pointer updates in `apps/web/AGENTS.md`, `packages/ui/AGENTS.md`, and the `web-design-guidelines` skill — one source of truth, three entry points.

## Acceptance

- docs/design/DESIGN_LANGUAGE.md exists and contains sections: Color semantics, Surface hierarchy, Categorical data display, Identity cell composition, Table loading states, Anti-patterns
- apps/web/AGENTS.md contains a ## Design language section with 6-8 decision rules (Mantine API explicit) and a pointer to docs/design/DESIGN_LANGUAGE.md
- packages/ui/AGENTS.md contains a one-line pointer to docs/design/DESIGN_LANGUAGE.md
- .agents/skills/web-design-guidelines/SKILL.md instructs agents to read docs/design/DESIGN_LANGUAGE.md before any UI work in apps/web/

## In scope

- `docs/design/DESIGN_LANGUAGE.md` (new file, new directory)
- `apps/web/AGENTS.md` (add `## Design language` section — do not alter other sections)
- `packages/ui/AGENTS.md` (add one-line pointer after the existing `## Styling` section — do not alter other sections)
- `.agents/skills/web-design-guidelines/SKILL.md` (prepend instruction to read DESIGN_LANGUAGE.md — do not alter the existing content)

## Out of scope

- Do NOT change any product code.
- Do NOT duplicate decision rules across files — DESIGN_LANGUAGE.md is the canonical source; AGENTS.md and the skill are pointers only.
- Do NOT invent decisions not established by Phase 01 — document what was built.
- Do NOT write aesthetic prose ("premium", "modern", "clean"). Every rule must be mechanically actionable.

## Notes / open questions

**The implemented code is the source of truth. Read these files before writing:**

- `apps/web/src/pages/sports/athletes/AthletesPage.tsx`
- `apps/web/src/pages/sports/athletes/components/AthletesTable.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/AthleteIdentity.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/CountryFlag.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/SocialLinks.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/LevelCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/MomentumCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteListStates/AthleteListLoading.tsx`
- `apps/web/src/pages/sports/athletes/utils/sport-colors.ts`
- `packages/ui/components/data-table/DataTable.tsx`
- `.agents/memory/athletes-list-design.md` — accumulated design principles from the implementation sessions; treat as the highest-fidelity source of rationale

---

**What "agent-executable" means:**

Bad (useless):
> Use shadows for a softer, more premium look.

Good (actionable):
> **Table surface:** Use `<Paper shadow="sm">` without `withBorder` when the Paper sits on a plain page background. **Why:** `withBorder` adds a hard 1px edge that reads as a panel boundary rather than a data surface; `shadow="sm"` achieves visual separation at lower contrast cost. **Exception:** use `withBorder` when the Paper is nested inside another elevated container (modal, drawer, another Paper).

Every rule must follow: **condition → Mantine API call → one-sentence why → exception if any.**

---

**Required sections and their content:**

**Color semantics** — a table mapping Mantine color names to their semantic meaning in this app. Derive from `sport-colors.ts` and `MomentumCell.tsx` for the actual mappings used:
- `gray` / `dimmed` → absent, unknown, unclassified, or a value the user does NOT filter/sort on
- `teal` → active, established, primary-positive (Football/Soccer; row hover accent)
- `orange` → Basketball; momentum rising
- `grape` → Tennis
- `blue` → developmental, informational; verified badge
- `red` → momentum declining, error-adjacent
- `green` → momentum positive/steady (check MomentumCell for exact mapping)
Only document colors actually used in the codebase.

**Surface hierarchy** — Paper variant rules: when to use `shadow="sm"`, `shadow="xs"`, `withBorder`, or no Paper at all. Document the actual pattern: data tables and their state siblings (loading, empty, error) all use the same `shadow="sm"` so no visual change occurs when state transitions happen.

**Categorical data display** — decision tree derived from what was actually built:
- Sport name in an identity cell → `<Text c={getSportColor(sport)} size="xs">` — colored text, never Badge, because Badge adds pill geometry that misaligns text in dense rows
- Level (Pro/College) → `<Badge variant="light">` with semantic color — status indicators with 2–4 values use contained Badge
- Momentum direction → `<FontAwesomeIcon>` + semantic color on the surrounding Text — directional indicators use FA icons, never Unicode
- Secondary descriptive text that is NOT a filter/sort dimension → `<Text c="dimmed" size="xs">`
- NEVER use `c="dimmed"` for a value the user can filter or sort on — dimmed communicates "ignorable"
- NEVER use `Badge variant="dot"` in dense table cells — the dot indicator is for list items and menu entries, not data cells; text misaligns

**Identity cell composition** — the actual three-line hierarchy as implemented in `AthleteIdentity.tsx`:
1. Avatar: `size={40}`, `radius="xl"`, `bd="1px solid var(--mantine-color-default-border)"` — round for people, square/sm-radius for organisations
2. Primary line: `<Group gap={6}>` — entity name `fw={600} size="sm"` + optional verified icon inline
3. Classification line: `<Group align="center" gap={4}>` — country flag (`Text size="sm"`) + sport label (`Text c={color} size="xs"`)
4. Social/action row: `<Group gap={4} mt={2}>` — platform icon anchors (`Anchor size="xs"`, FA icons)
The Stack between lines uses `gap={2}`. The social row adds `mt={2}` on top of that gap (4px total before the social row).

**Table loading states** — document the full skeleton pattern as implemented in `AthleteListLoading.tsx`:
- The skeleton must mirror the COMPLETE layout of the loaded component: toolbar row above the table AND footer row below it, not just the data rows. Missing either causes a layout shift when data arrives.
- Skeleton bar heights must match the rendered line-height of their target text, not the font-size: `height="calc(var(--mantine-font-size-sm) * 1.55)"` for `size="sm"` text (14px × 1.55 ≈ 21.7px), `height="calc(var(--mantine-font-size-xs) * 1.55)"` for `size="xs"` text. Using integer px values causes sub-pixel rounding drift that accumulates across rows.
- Use `isPending` (no data yet) → show full skeleton with toolbar + table + footer. Use `isFetching && !isPending` (refetching) → show `<LoadingOverlay>` over the existing rows. These are distinct states with different UX goals.
- Skeleton structural checklist: (1) toolbar Group with same `px`/`py` as the real toolbar, (2) Table.ScrollContainer → Table → Thead/Tbody mirroring the real column widths, (3) footer Group with same `px`/`py` as the real footer.

**Sort icon — active-column-only** — document the `sortIcon()` pattern in `DataTable.tsx`:
- Only the actively sorted column shows a directional icon (`faArrowUp` / `faArrowDown`).
- Inactive sortable columns show no icon at all (return `null`) — showing a bidirectional `faArrowsUpDown` on every sortable header adds visual noise without informational value.
- The icon is wrapped in `<span aria-hidden="true">` — sort state is communicated accessibly via `aria-sort` on the `<th>`, not the icon.

**Row hover accent** — document the `--table-highlight-on-hover-color` pattern in `AthletesTable.tsx`:
- Set `--table-highlight-on-hover-color: var(--mantine-color-teal-light)` on the Paper wrapper of the DataTable.
- Do not set it on the DataTable component itself (shared; would affect all uses).
- Sticky cells in `DataTable.module.css` must inherit this variable in their `tr:hover` rule.
- Future verticals use their own accent: music → `blue-light`, etc.

**Anti-patterns** (highest-value section — prevents regressions):
- `c="dimmed"` or `color="gray"` for sport name or any filter/sort dimension → use `getSportColor()` or the appropriate semantic color
- Unicode directional characters (`▲ ▼ — ↑ ↓`) for status or sort indicators → use `faArrowUp`, `faArrowDown`, `faMinus` from `@fortawesome/pro-solid-svg-icons`, imported individually by path
- `<Paper withBorder>` on a plain page background → use `shadow="sm"` instead
- `<Badge variant="dot">` inside a dense table cell → use `<Text c={color}>` for taxonomy labels; reserve Badge for status and level indicators
- `c="dimmed"` on a value the user filters or sorts on → dimmed communicates "secondary/ignorable"; use semantic color
- A skeleton that only covers data rows but not the toolbar/footer → always mirror the full layout structure
- Skeleton bar `height={N}` (integer px) for a text row → use `calc(var(--mantine-font-size-*) * 1.55)` for sub-pixel precision
- Showing a sort icon on every sortable column header → show the directional icon only on the active column; return `null` for inactive columns
- A new component library installed alongside Mantine → never; use Mantine props, variants, CSS vars, and `factory()`
- A new `packages/ui` export for a pattern used by only one consumer → colocate until two consumers exist (ADR-006)

---

**AGENTS.md section shape** (6–8 bullets, each under two lines, with link):

```markdown
## Design language

Read `docs/design/DESIGN_LANGUAGE.md` before any design-oriented UI work in `apps/web/`. Quick-reference rules:

- **Table surface:** `<Paper shadow="sm">` without `withBorder` on plain page backgrounds. All state siblings (loading, empty, error) use the same Paper variant so no visual jump occurs on transition.
- **Color semantics:** `dimmed`/`gray` = absent or ignorable. `teal` = active/established. `orange` = rising. `red` = declining. `blue` = informational. Never use `dimmed` for a value the user can filter or sort on.
- **Categorical data:** sport label → `<Text c={getSportColor(sport)}>`. Level (Pro/College) → `<Badge variant="light">`. Momentum direction → FA icon + semantic color. Secondary non-filter text → `<Text c="dimmed" size="xs">`. Never `Badge variant="dot"` inside a dense table cell.
- **Identity cells:** Avatar `size={40} radius="xl"` with border ring. Three lines: name (fw=600 sm) → classification (flag + sport color) → social icon row. Stack `gap={2}`; social row adds `mt={2}`. Round avatar = person; sm-radius = organisation.
- **Table loading:** skeleton must mirror the FULL layout — toolbar row, table, footer row. Bar heights use `calc(var(--mantine-font-size-sm) * 1.55)` not integer px. `isPending` → skeleton; `isFetching && !isPending` → `LoadingOverlay`.
- **Sort icon:** only the active column shows a directional FA icon. Inactive columns return `null`. Wrap in `aria-hidden` span; communicate sort state via `aria-sort` on the `<th>`.
- **Row hover:** set `--table-highlight-on-hover-color: var(--mantine-color-<accent>-light)` on the Paper wrapper, not on DataTable. Accent is vertical-specific (athletes = teal).
- **Icons:** FA (`@fortawesome/pro-solid-svg-icons`, individual path imports) for all status/directional indicators. No Unicode symbols anywhere.

Full rationale, decision trees, and anti-patterns: `docs/design/DESIGN_LANGUAGE.md`.
```

---

**packages/ui/AGENTS.md pointer** — add after the existing `## Styling` section:

> For visual design direction governing how components in `apps/web/` should look — color semantics, surface hierarchy, cell composition, loading state patterns — read `docs/design/DESIGN_LANGUAGE.md`.

---

**web-design-guidelines skill** — prepend before the existing content:

> Before any UI work in `apps/web/`, read `docs/design/DESIGN_LANGUAGE.md` for Chartmetric-specific design decisions (color semantics, surface hierarchy, cell composition, loading states, anti-patterns). The guidance below (Vercel Web Interface Guidelines) applies after those project-specific rules.

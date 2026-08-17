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
- `packages/ui/AGENTS.md` (add one-line pointer — do not alter other sections)
- `.agents/skills/web-design-guidelines/SKILL.md` (prepend instruction to read DESIGN_LANGUAGE.md)

## Out of scope

- Do NOT change any product code.
- Do NOT duplicate decision rules across files — DESIGN_LANGUAGE.md is the canonical source; AGENTS.md and the skill are pointers.
- Do NOT invent decisions not established by Phase 01 — document what was built.
- Do NOT write aesthetic prose ("premium", "modern", "clean"). Every rule must be mechanically actionable.

## Notes / open questions

**Before writing, read the Phase 01 implementation:**
- `apps/web/src/pages/sports/athletes/AthletesPage.tsx`
- `apps/web/src/pages/sports/athletes/components/AthletesTable.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/AthleteIdentity.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/LevelCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/MomentumCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteListStates/AthleteListLoading.tsx`

Capture decisions as they were implemented — the implemented code is the source of truth, not this spec.

---

**What "agent-executable" means:**

Bad (useless):
> Use shadows for a softer, more premium look.

Good (actionable):
> **Table surface:** Use `<Paper shadow="sm">` without `withBorder` when the Paper sits on a plain page background (white or gray-0). Why: `withBorder` adds a hard 1px edge that reads as a panel boundary rather than a data surface; `shadow="sm"` achieves visual separation at lower contrast cost. Exception: use `withBorder` when the Paper is nested inside another elevated container (modal, drawer, another Paper).

Every rule must follow: **condition → Mantine API call → one-sentence why → exception if any.**

---

**Required sections and their content:**

**Color semantics** — a table mapping Mantine color names to their semantic meaning in this app:
- `gray` → absent, unknown, or unclassified (do not use for a positive category)
- `teal` → active, established, primary-positive
- `blue` → developmental, aspirational, informational
- `orange` → hot, rising, momentum-up
- `red` → declining, momentum-down, error-adjacent
- `green` → success (when applicable)
Only include colors actually used in this codebase.

**Surface hierarchy** — Paper variant rules: when to use `shadow="sm"`, `shadow="xs"`, `withBorder`, or no Paper at all.

**Categorical data display** — decision tree for Badge vs. dimmed text vs. plain text:
- 2–5 fixed categories that are filter dimensions → `<Badge variant="dot">` (the dot encodes category visually; label provides accessible text)
- 2–5 fixed categories that are status indicators (active/inactive) → `<Badge variant="light">` with semantic color
- Secondary descriptive text (not a filter dimension, not a status) → `<Text c="dimmed" size="xs">`
- Never use `c="dimmed"` for a value the user filters or sorts on — dimmed communicates "secondary/ignorable"

**Identity cell composition** — the hierarchy for entity identity cells in a data table:
1. Avatar: `size={40}`, `radius="xl"`, `bd="1px solid var(--mantine-color-default-border)"` — anchors the entity
2. Primary line: entity name, `fw={600} size="sm"`, verified badge inline
3. Classification line: category badge(s) with flag prefix if geographic
4. Social/secondary actions: icon row with `gap={4}`, icon size `xs`
Limit to two text lines. A third line is a design failure — consolidate.

**Table loading states** — rule: use `<Skeleton>` rows (not a centered `<Loader>`) when the loading state replaces a table. Five rows at `height={48} radius="sm" animate` inside `<Stack gap={1}>` match the table row height and communicate the incoming data shape. Use a centered `<Loader>` only for non-tabular loading states (e.g., a detail view or a modal).

**Anti-patterns** (the highest-value section — prevents regressions):
- `color="gray"` for a positive or active category → use `teal` or the appropriate semantic color
- Unicode directional characters (`▲ ▼ —`) for status indicators → use FontAwesome icons from `@fortawesome/pro-solid-svg-icons`, imported individually
- `<Paper withBorder>` on a plain page background → use `shadow="sm"` instead
- A third text line in an identity cell → consolidate into two lines
- `c="dimmed"` on a value the user filters or sorts on → use a Badge
- A new component library installed alongside Mantine → never; use Mantine props, variants, vars, and `factory()`
- A new `packages/ui` export for a pattern used by only one consumer → colocate until two consumers exist (ADR-006)

---

**AGENTS.md section shape** (6–8 bullets, each under two lines, with link):

```markdown
## Design language

Read `docs/design/DESIGN_LANGUAGE.md` before any design-oriented UI work. Quick-reference rules:

- **Table surface:** `<Paper shadow="sm">` without `withBorder` on plain page backgrounds.
- **Color semantics:** `gray` = absent/unknown. `teal` = active. `blue` = developmental. `orange` = rising. `red` = declining. Never use `gray` for a positive category.
- **Categorical data:** filter-dimension categories → `<Badge variant="dot">`. Status indicators → `<Badge variant="light">`. Secondary descriptive text → `<Text c="dimmed" size="xs">`. Never `c="dimmed"` on a value the user can filter or sort.
- **Identity cells:** two text lines maximum. Avatar at `size={40} radius="xl"` with border ring. Classification as Badge, not dimmed text.
- **Table loading:** five `<Skeleton height={48} radius="sm" animate>` rows, not a centered Loader.
- **Icons:** FontAwesome (`@fortawesome/pro-solid-svg-icons`) for all status/directional indicators. No Unicode symbols.
- **Component library:** Mantine exclusively. Do not install a second component library. A new `packages/ui` export requires two distinct consumers (ADR-006).

Full rationale, decision trees, and anti-patterns: `docs/design/DESIGN_LANGUAGE.md`.
```

---

**packages/ui/AGENTS.md pointer** — add after the existing `## Styling` section:

> For visual design direction governing how components in `apps/web/` should look — color semantics, surface hierarchy, cell composition, loading state patterns — read `docs/design/DESIGN_LANGUAGE.md`.

---

**web-design-guidelines skill** — prepend before the existing content:

> Before any UI work in `apps/web/`, read `docs/design/DESIGN_LANGUAGE.md` for Chartmetric-specific design decisions (color semantics, surface hierarchy, cell composition, loading states, anti-patterns). The guidance below (Vercel Web Interface Guidelines) applies after those project-specific rules.

# Product Requirements

## Athletes page design overhaul

**Ask:** "I want to improve the design on the athletes page and as you do it I want to add documentation to help other agents make better design decisions"

**Goal:** Redesign the athletes list page — visual surface, athlete identity presentation, and page layout — using design judgment and Mantine's own style system exclusively. Capture the resulting decisions as durable, agent-executable documentation so future agents apply the same design intelligence without reconstructing it.

### A — Visual polish

1. **LoadingOverlay (bug fix):** Wrap `<DataTable>` in `<Box pos="relative">` and add `<LoadingOverlay visible={isFetching} overlayProps={{ blur: 1 }} loaderProps={{ "aria-label": … }}>` in `AthletesTable`. The `isFetching` prop is received but never rendered — this is a missing state.

2. **Table surface:** Replace `<Paper withBorder>` with `<Paper shadow="sm">` in `AthletesTable`. On a light page background `withBorder` creates a hard 1px edge that reads as a panel boundary. `shadow="sm"` achieves visual separation with lower contrast noise. Keep `radius="md"`.

3. **Level badge color semantics:** In `LevelCell`, change professional from `color="gray"` to `color="teal"`. Gray reads as inactive or absent in Mantine's semantic color system. Teal = active/established; blue (college, existing) = developmental/aspirational.

4. **Momentum indicators:** In `MomentumCell`, replace Unicode `▲ ▼ —` with FontAwesome icons (`faArrowUp`, `faArrowDown`, `faMinus` from `@fortawesome/pro-solid-svg-icons`), matching the rest of the codebase's icon language.

5. **Row count alignment:** Right-align the "Showing 1–50" text by placing it inside the `<Group justify="space-between">` that frames the pagination controls, rather than floating left above them.

### B — Richer AthleteIdentity cell

6. **Avatar ring:** `size={40}`, `radius="xl"`, `bd="1px solid var(--mantine-color-default-border)"`. The ring anchors each athlete as a discrete visual entity when scrolling data-dense rows.

7. **Two-line information hierarchy:**
   - Line 1: name (`fw={600} size="sm"`) + verification badge inline
   - Line 2: country flag prefix + sport as `<Badge variant="dot" size="xs" color="gray">` — the dot replaces dimmed text, making sport scannable in the column without the "unimportant" connotation of `c="dimmed"`.

8. **Social links:** Set icon `gap={4}` and size `xs` — reduces horizontal footprint, no behavioural change.

### C — Page-level layout

9. **Extract `AthletesHeader`:** Pull `<Title>` + `<Text c="dimmed">` into a private named sub-component `AthletesHeader` inside `AthletesPage.tsx`. Header becomes purely editorial — title and subtitle, nothing else.

10. **Controls row:** Move `<AthleteColumnPicker>` out of the header `<Group>` into a new `<Group justify="flex-end">` between `<AthleteFilters>` and `<AthleteListContent>`. Header is editorial; controls row is operational. They no longer share a line.

11. **Skeleton loading state:** Replace the centered `<Loader>` + dimmed text in `AthleteListLoading` with five `<Skeleton height={48} radius="sm" animate>` rows in a `<Stack gap={1}>`. A table-shaped skeleton communicates incoming data shape and eliminates layout shift.

### Documentation (tooling — Phase 02)

12. Create `docs/design/DESIGN_LANGUAGE.md` — the canonical design reference: color semantics table, surface hierarchy rules, categorical data display decision tree, identity cell composition hierarchy, table loading state rationale, anti-patterns.

13. Add `## Design language` section to `apps/web/AGENTS.md`: 6–8 concrete decision rules (Mantine API calls explicit), pointer to `docs/design/DESIGN_LANGUAGE.md`.

14. Add one-line pointer in `packages/ui/AGENTS.md` to `docs/design/DESIGN_LANGUAGE.md`.

15. Update `.agents/skills/web-design-guidelines/SKILL.md` to instruct agents to read `docs/design/DESIGN_LANGUAGE.md` before any UI work in `apps/web/`.

**Referenced ADRs:**

- ADR-006: `AthletesHeader` stays private to the page file until a second consumer appears.
- ADR-003: No barrel re-exports. No new `packages/ui` subpath export.

**Out of scope:**

- No API, query logic, filter, or column definition changes.
- No changes to the music/artists page.
- No new `packages/ui` exports.
- No new permissions.
- No new component library — Mantine's style system exclusively.

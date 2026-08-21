# Design Language

Chartmetric-specific design decisions for `apps/web/`. This file is the **index**: the map, the reading order, and the pointer to every rule. The rules themselves live in four focused files beside it so each stays small enough to load only what a task needs.

This is the single source of truth for **all** verticals (athletes, music artists, creators, future entity types); rules apply universally unless marked vertical-specific. `apps/web/AGENTS.md` and `packages/ui/AGENTS.md` carry short-form pointers; the `web-design-guidelines` skill prepends a read instruction. Do not duplicate rules across files, and do not restate a token's value once its owner is named.

## How to read this

Two layers, in two occasions:

- **Before designing a view**, read the [Decision Framework](framework.md) — how to approach any view before you choose a component.
- **Before writing its components**, read the [Visual System Rules](rules-visual-system.md) (color, state, contrast, type, spacing, surfaces) and the [Component Rules](rules-components.md) (per-component patterns + anti-patterns).

Each rule states its **condition, the Mantine/`@repo/ui` API it maps to, and one sentence of why**; exceptions are inline. Most rules point at a token owner (`packages/ui/theme/theme.ts`, `@repo/ui/data-table`) rather than restating its value — when a number and a token disagree, the token wins.

### Route by task

| Your task                                                           | Read                                                                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Design a new page or view                                           | [Framework](framework.md), then both rules files                                                                       |
| Build or change a table (columns, loading, sort, hover, pagination) | [Component Rules](rules-components.md) + [Spacing and table density](rules-visual-system.md#spacing-and-table-density) |
| Add a cell, badge, tag, chip, or icon                               | [Component Rules](rules-components.md)                                                                                 |
| Pick a color, state treatment, type size, or surface                | [Visual System Rules](rules-visual-system.md)                                                                          |
| Add a filter, control, or header layout                             | [Filters, controls, and layout](framework.md#filters-controls-and-layout)                                              |
| Verify a visual change                                              | [Method](method.md)                                                                                                    |

## Contents

### [Decision Framework](framework.md) — read before designing a view

- [Product philosophy](framework.md#product-philosophy)
- [Design principles we follow](framework.md#design-principles-we-follow)
- [App shell](framework.md#app-shell)
- [Designing a new view](framework.md#designing-a-new-view)
- [Data states](framework.md#data-states)
- [Filters, controls, and layout](framework.md#filters-controls-and-layout)
- [Pagination](framework.md#pagination)
- [Charts and motion](framework.md#charts-and-motion)
- [Performance is part of the design](framework.md#performance-is-part-of-the-design)

### [Visual System Rules](rules-visual-system.md) — the cross-cutting visual language

- [Vertical accent colors](rules-visual-system.md#vertical-accent-colors)
- [Color semantics](rules-visual-system.md#color-semantics)
- [Interactive state and tone](rules-visual-system.md#interactive-state-and-tone)
- [Accessibility and contrast](rules-visual-system.md#accessibility-and-contrast)
- [Typography](rules-visual-system.md#typography)
- [Spacing and table density](rules-visual-system.md#spacing-and-table-density)
- [Surface hierarchy](rules-visual-system.md#surface-hierarchy)

### [Component Rules](rules-components.md) — per-component patterns

- [Categorical data display](rules-components.md#categorical-data-display)
- [Identity cell composition](rules-components.md#identity-cell-composition)
- [Data display integrity](rules-components.md#data-display-integrity)
- [Table loading states](rules-components.md#table-loading-states)
- [Sort icon and sorted headers](rules-components.md#sort-icon-and-sorted-headers)
- [Row hover](rules-components.md#row-hover)
- [Icons](rules-components.md#icons)
- [Theme tokens](rules-components.md#theme-tokens)
- [Mantine mechanics](rules-components.md#mantine-mechanics)
- [Shared-component ownership](rules-components.md#shared-component-ownership)
- [Anti-patterns](rules-components.md#anti-patterns) — the single scannable quick-reference

### [Method](method.md) — process, not design law

- [Running the parity loop](method.md#running-the-parity-loop)

## Sources

External references these rules are derived from. Distilled, not duplicated — read the source for full rationale.

- **Refactoring UI** — Adam Wathan & Steve Schoger. The basis for [Design principles we follow](framework.md#design-principles-we-follow): hierarchy, spacing systems, grayscale-first, muted color.
- **The Practical Guide to WCAG Contrast (WCAG 2.2 + APCA)** — https://www.designsystemscollective.com/the-practical-guide-to-wcag-contrast-updated-for-wcag-2-2-apca-preview-19f1a4ca6be4
- **Color Contrast and Accessibility (WCAG, APCA, accessible palettes)** — https://colorarchive.org/guides/color-contrast-accessibility-guide/
- **`apca-w3`** (contrast calculation for a future CI lint) — https://github.com/paularmstrong/apca-w3
- **Vercel Web Interface Guidelines** — fetched live by the `web-design-guidelines` skill; the general baseline these project-specific rules layer on top of.

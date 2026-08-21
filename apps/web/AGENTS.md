# Web Application Instructions

This directory contains the authenticated React and Vite SPA.

Also follow `/AGENTS.md`, `/apps/AGENTS.md`, and `/docs/architecture/access-and-feature-gating.md`.

## Design language

Read `docs/design/DESIGN_LANGUAGE.md` before any design-oriented UI work in `apps/web/`. It is the index of the design language — it routes by task to the framework, rules, and method files beside it; load only the file your task needs. Quick-reference rules:

- **New views start from the decision framework:** write the decision sentence (“after this view a user can decide ___”), pick the comparison unit (table / chart / KPI cards), build the reading order (orientation → signals → evidence → action), and design loading/error/empty/partial states before polishing the loaded state.
- **Table surface:** `<Paper shadow="sm" radius="md">` without `withBorder` on plain page backgrounds. All state siblings (loading, empty, error) use the same Paper variant so no visual jump occurs on transition.
- **Color semantics:** `dimmed`/`gray` = absent or ignorable. `teal` = active/established. `orange` = rising. `red` = declining. `blue` = informational. Never use `dimmed` for a value the user can filter or sort on.
- **Categorical data:** sport/taxonomy label → `<Text c={getSportColor(sport)}>`. Level (Pro/College) → `<Badge variant="light">`. Momentum direction → FA icon + semantic color. Secondary non-filter text → `<Text c="dimmed" size="xs">`. Never `Badge variant="dot"` inside a dense table cell.
- **Identity cells:** round avatar (`radius="50%"` — the square-leaning scale means no radius key reaches a circle) = person; `radius="sm"` = organisation, with the default-border ring. Cell text renders through `@repo/ui/cell-text` (`CellText`), names one size above their row; entity chips through `@repo/ui/entity-chip`, kind tags through `@repo/ui/kind-tag`.
- **Table loading:** skeleton must mirror the full layout — toolbar row, table, footer row — spreading the `TABLE_TOOLBAR_PADDING` / `TABLE_FOOTER_PADDING` / `TABLE_VERTICAL_SPACING` constants `@repo/ui/data-table` exports rather than restating them. Bar heights derive from `calc(var(--mantine-font-size-*) * var(--mantine-line-height-*))`, never a literal multiplier. `isPending` → full skeleton; `isFetching && !isPending` → pass `renderSkeletonRow` so body rows go skeleton while headers stay real. Never `LoadingOverlay`.
- **Sort icon:** only the active column shows a directional FA icon. Inactive columns return `null`. Wrap icon in `aria-hidden` span; communicate sort state via `aria-sort` on the `<th>`.
- **Row hover / state changes:** spread `ROW_HOVER_STYLE` from `@repo/ui/data-table` on the Paper wrapper, not on DataTable — gray in light mode, accent wash in dark. General rule: any state or mode change (hover, selected, tag/chip washes) shifts one step on the scale, never a bright/saturated leap.
- **Icons:** FA outline (`@fortawesome/pro-regular-svg-icons`, individual path imports) everywhere — never solid, never Unicode symbols (`▲ ▼ — ↑ ↓`).
- **Control placement:** filters live in the page header grouped by target; utility controls (column picker, export) share the title/count row right-aligned — no control gets an otherwise-empty row of its own. Header wraps to a balanced second row, never a lopsided strip.
- **Adaptive layout:** headers wrap by group — the container wraps while title+count, search, each pill group, and utility controls are atomic `wrap="nowrap"` units; search reflows with the filters, utility controls right-align via `ml="auto"` inside the wrap, fixed widths become `w={{ base: "100%", sm: N }}`. See [Adaptive layout](../../docs/design/framework.md#adaptive-layout).
- **Accessibility & contrast:** every text/background and label/fill pair meets WCAG 2.2 AA (4.5:1 text, 3:1 large text/UI) in both color schemes — measured against the actual fill (button/badge/washed row), not the page. Color is never the only signal; focus is always visible.

Full rationale, decision trees, and anti-patterns: `docs/design/DESIGN_LANGUAGE.md`.

## Skills

Consult the matching skill in `/.agents/skills/` before working in its area:

- `frontend-feature-workflow` — mandatory shared-component discovery, cross-entity precedent review, parity decisions, implementation order, and validation for any frontend feature work.
- `vercel-react-best-practices` — React component and performance patterns.
- `vercel-composition-patterns` — component composition, compound components, and reusable component APIs.
- `web-design-guidelines` — UI, UX, and accessibility, when creating or reviewing components.
- `mantine-custom-components`, `mantine-form`, `mantine-combobox` — building on Mantine primitives, forms, and select/autocomplete components.
- `vite` — Vite configuration and plugins.
- `vitest` — writing and structuring tests.
- `lingui-best-practices`, `enhanced-message-context` — i18n, message extraction, and translations.

## VerticalConfig

VerticalConfig may define only product ID, hostnames, product name, logo/favicon, Mantine theme inputs, and entity terminology.

Do not add feature lists, capability lists, route inventories, duplicate navigation inventories, user permissions, Stripe plans, or account-specific access.

Feature existence belongs in application code. Access belongs in AuthService.

## Features and routes

Application code defines which routes and screens exist.

Ordinary features require no permission declaration.

A route or action declares a permission only when access differs by plan, entitlement, role, seat, security boundary, override, or API scope.

```ts
{
  path: "/exports",
  element: <ExportsPage />,
  requiredPermission: "exports.create",
}
```

Use the same route metadata for navigation visibility where practical. Do not maintain duplicate route and navigation catalogs.

## AccessContext

The frontend consumes resolved products and permissions from AuthService.

Preferred:

```ts
can("exports.create");
```

Forbidden:

```ts
plan === "enterprise";
```

The frontend may hide navigation, disable actions, display upgrade messaging, and protect routes from confusing navigation. It is not the security boundary. Every protected operation must also be enforced by the API.

## Components

Use Mantine before custom primitives. Components should have typed props, semantic HTML, keyboard support, accessible labels, and loading/empty/error/success states.

Generic presentational components belong in `packages/ui`. Application-specific components stay here.

Before implementing a frontend feature, inspect the supported `@repo/ui` exports and equivalent features across every entity and vertical. Reuse an existing molecule, extend it generically, or extract repeated mechanics into `packages/ui` before writing entity-specific presentation code.

Equivalent features should remain behaviorally and visually consistent across entities by default. Keep a difference only when product or domain requirements justify it; make the reason evident in the implementation and tests.

## Module layout

Page code lives under `src/pages/<vertical>/<page>/`. Identify the owning concern before adding a file; do not create a flat collection and reorganize later.

- Group a page's code by concern (`api/`, `columns/`, `filters/`, `components/`) once more than a couple of files share one.
- One React function component per `.tsx` file. Tests and an intentionally colocated compound-component implementation are the exceptions.
- When several components exist only to implement one high-level component, the composer sits at the feature-folder root and its private building blocks go in a nested `components/` directory. Nothing outside that group imports from the nested folder.
- Name modules for the responsibility their exports collectively serve (`filter-state.ts`), never for one data type they use (`values.ts`) or a generic bucket (`utils.ts`, `helpers.ts`).
- Handwritten types live in the owning folder's `types.ts`, which stays a leaf module. Derive API types from `@repo/api-client`; hand-write only what exists solely in the frontend, such as component props and UI display modes.
- Split modules by responsibility, not because a function is a hook. A module whose only content wraps one sibling function in one hook adds no contract — keep tightly coupled pure logic and its single orchestration hook together while the module stays focused. Move support hooks and formatters out of a component module only when they form a distinct, nameable responsibility.
- Name state after the values it represents. Reserve `draft` for state with an explicit apply/discard lifecycle; a control may hold an uncommitted preview value during interaction without turning the feature's state into a draft abstraction.

## Responsive layout

Every screen, layout, and component must remain usable at mobile widths. This applies to all UI work, not only pages designed for mobile.

Rules:

- Use Mantine responsive primitives: AppShell `breakpoint`/`collapsed`, `hiddenFrom`/`visibleFrom`, responsive style props (`w={{ base: "100%", sm: 400 }}`), and `Grid`/`Flex`/`SimpleGrid` responsive props.
- Do not hard-code widths or heights that overflow small screens. Wide content (tables, charts) scrolls within its own container instead of the page.
- Verify layout changes at a mobile width (below the AppShell `breakpoint`) and at desktop width before finishing.

## TanStack Query

Use TanStack Query for remote server state. Do not mirror query results into another global store.

Query keys include every value that changes returned data, including account ID for account-scoped data.

## API access

Use the generated OpenAPI client once available.

Do not import Fastify internals, import Drizzle schemas into UI code, duplicate server response types, access databases directly, or place server credentials in frontend code.

## Completion checklist

- No duplicate feature or permission catalog was introduced.
- VerticalConfig remains presentation-only.
- Restricted actions use stable permissions.
- Account-scoped query keys include account ID.
- API contracts are not duplicated.
- Shared components and peer-entity precedents were inspected before implementation.
- Cross-entity differences are intentional and tested.
- Relevant tests and production build pass.

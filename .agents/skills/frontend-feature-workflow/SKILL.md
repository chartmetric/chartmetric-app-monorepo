---
name: frontend-feature-workflow
description: Create, change, refactor, or review Chartmetric frontend features through a mandatory shared-component and cross-entity precedent audit, parity-first UX decisions, shared-first implementation, generated API types, behavioral tests, and responsive visual validation. Use for any React UI work under apps/web or packages/ui, including pages, components, tables, filters, forms, navigation, empty/loading/error states, and entity-specific features for artists, creators, athletes, or future verticals.
---

# Frontend Feature Workflow

Treat shared components and established cross-entity behavior as the default. Keep entity implementations different only where product or domain requirements genuinely differ.

## 1. Inspect before editing

Read `apps/web/AGENTS.md`, `packages/ui/AGENTS.md` when applicable, and the matching technology skills those files identify.

Complete both audits before writing code:

1. Inspect `packages/ui/package.json` exports and search `packages/ui/components` for reusable primitives, molecules, and patterns.
2. Search all entity and vertical implementations in `apps/web` for the same feature, interaction, state, terminology, or layout. Inspect their tests as well as their components.

Check the worktree state of the selected shared components and peer baseline. Do not unknowingly overwrite in-progress work or treat an uncommitted experiment as an established contract.

State the relevant shared components and peer implementations found. Choose one path:

1. Reuse an existing shared component unchanged.
2. Extend an existing shared component through entity-neutral props or composition.
3. Extract repeated interaction mechanics into a new `packages/ui` molecule.
4. Keep the implementation application-specific because it is genuinely domain-specific or has no credible reuse case.

Do not duplicate an existing interaction merely because copying it is locally faster.
Share stable mechanics without forcing a generic page shell from a single example; extract broader orchestration only after multiple consumers demonstrate the same contract.

## 2. Resolve behavior and parity

Use the closest established entity as the behavioral baseline. Match its structure, interaction timing, loading and error handling, responsive behavior, and accessibility unless the task establishes a reason to differ.

Resolve material uncertainties before implementation, including:

- User flow and success behavior.
- Automatic, debounced, submit-based, or drag-end updates.
- URL persistence and browser navigation behavior.
- Loading, empty, error, disabled, and partial-data states.
- Desktop and mobile behavior.
- Access or permission differences.
- API data, sorting, filtering, pagination, and option semantics.

Ask only unresolved questions. If a proposed entity differs from its peers, identify the reason explicitly. Do not reproduce a peer implementation's apparent bug or obsolete workaround merely for parity.

## 3. Implement shared mechanics first

Put reusable presentation and interaction mechanics in `packages/ui`. Shared components must:

- Use Mantine primitives where possible.
- Remain entity- and vertical-neutral.
- Accept values, labels, options, state, and callbacks through typed props.
- Emit user intent through events without fetching data or owning server state.
- Preserve keyboard, focus, semantic, and responsive behavior.
- Expose only intentional package exports.

Keep application and entity components responsible for:

- Generated API types and API calls.
- TanStack Query integration and URL state.
- Translated labels and entity terminology.
- Mapping API data into shared-component props.
- Mapping component events into API query parameters.
- Authorization and genuine domain-specific behavior.

Do not import application code into `packages/ui`, hard-code entity names in shared components, or create parallel entity-specific versions of the same mechanic.

## 4. Establish behavioral tests

Write or update the narrowest meaningful test before implementation and observe the expected failure.

Test shared mechanics in `packages/ui`, including interaction, controlled state, accessibility, disabled behavior, and edge cases. Test entity composition in `apps/web`, including generated-client parameters, translations, loading/error states, and intentional differences from the peer baseline.

When a shared component changes, run its tests and the tests of every affected consumer. Prefer role- and behavior-based assertions over snapshots or implementation details.

## 5. Validate the rendered feature

Inspect the feature in a real browser at desktop and mobile widths. Exercise the complete user flow, keyboard interaction, overflow, overlays, loading, empty, and error states relevant to the change. Compare it with the peer implementation used as the baseline.

For portals, popovers, menus, modals, and tooltips, verify actual placement, viewport containment, focus behavior, and outside-click or Escape dismissal. DOM-only tests do not prove geometry.

If browser validation is unavailable, report that limitation explicitly and do not claim the feature was visually verified.

## 6. Complete validation

Run the checks relevant to every changed package:

```sh
pnpm --filter @repo/ui test
pnpm --filter @repo/ui typecheck
pnpm --filter @repo/ui lint
pnpm --filter web extract
pnpm --filter web exec lingui compile --strict
pnpm --filter web test
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Run translation extraction only when translatable messages changed. Review the diff for accidental duplication, entity-specific assumptions in shared code, stale generated artifacts, and unrelated changes. Report the shared components reused or created, the peer baseline inspected, intentional differences, visual checks, and commands actually run.

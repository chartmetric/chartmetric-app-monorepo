# Design Language — Method

_Part of the [Design Language](DESIGN_LANGUAGE.md). Read the [index](DESIGN_LANGUAGE.md) for the map and reading order._

## Running the parity loop

Process, not design law: the [rules files](DESIGN_LANGUAGE.md#contents) say what to build; this is how the team verifies visual changes against the reference prototype.

Tooling is committed: `pnpm --filter web screenshot [route] [out] [light|dark] [width]` drives the system Chrome against the dev server via the auth-less `preview.html` entry. Width defaults to the 1512px reference; pass a narrow width for the [adaptive layout](framework.md#adaptive-layout) checks. Rules of the loop, each learned the hard way:

- **Compare in the reviewer's color scheme, and check both.** The first loop ran dark-only and shipped a light mode that failed review on sight.
- **Compare at the reviewer's viewport width.** Oversized screenshot viewports flatter density; 1512px is the reference width.
- **Measure; never eyeball.** `getBoundingClientRect` for geometry, sampled hexes for color, a fresh-context agent for image comparison when the session cannot load screenshots.
- **DOM computed styles are the arbiter.** When a pixel heuristic says "heavier" and `getComputedStyle` says 400/Inter/11px on both elements, the DOM wins — antialiasing lies at small sizes.
- **A static reference shows the rest state only — never delete an interactive affordance because a screenshot lacks it.** The pinned columns' scrolled-state shadow was lost exactly this way. Reproduce the interactive state before removing hover/scroll/focus behavior; when deleting a stale test, check whether the behavior it guarded is stale or only its implementation.
- **Every delta lands as a rule in the design language in the same iteration** — in its topical home (the matching rules file), with numbers pointed at their token owner rather than restated.

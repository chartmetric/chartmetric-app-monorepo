# Design Language — Decision Framework

How to approach any new view, before you choose a component. Read this before designing; before writing components, read the [visual system rules](rules-visual-system.md) and [component rules](rules-components.md).

_Part of the [Design Language](DESIGN_LANGUAGE.md). Read the [index](DESIGN_LANGUAGE.md) for the map and reading order._

## Product philosophy

This is a professional analytics workspace, not a consumer product. Its users — analysts, managers, operators — spend hours comparing entities, scanning ranked tables, and moving between profiles. Every design decision favors speed, stable context, and information density over spectacle. The reference points are calm tools (Notion, Linear, a Bloomberg terminal), not expressive products (Spotify, Instagram).

- A screen exists to get the user to a defensible answer with fewer clicks and less scrolling. Color, imagery, animation, and large type earn their place only by improving comprehension, orientation, or feedback — otherwise they compete with the data.
- The product spans music, sports, creators, and future verticals but remains **one workspace**: one shell, one interaction model, one hierarchy. Data and domain vocabulary change inside the shell; the visual language does not. VerticalConfig varies branding and terminology — never interaction patterns.
- Density is a capacity decision, not an aesthetic. On a typical display, compact text and spacing fit roughly half again as many comparable rows as leisurely sizing, and the dominant task is comparison. `packages/ui/theme/theme.ts` already encodes this (a tightened spacing scale, `Button`/`Input` defaulting to the compact 26px `xs` tier — read the current tokens from the theme, not from prose). Do not undo it locally with custom padding, larger type, or hero regions — and do not tighten further with per-component overrides; change the theme or nothing.

## Design principles we follow

Distilled from _Refactoring UI_ (Wathan & Schoger) and adapted to a data-dense workspace. These are the aesthetic defaults that make an unstyled screen already look considered; the [visual system](rules-visual-system.md) and [component rules](rules-components.md) implement them.

- **Hierarchy is communicated by weight, size band, and color — in that order — not by making things bigger.** A dense screen has a few discrete size bands, not a continuum. Emphasis is usually _de-emphasis of everything else_ (dimmed secondary text) rather than a louder primary.
- **Start in grayscale; add color only to carry meaning.** If a layout does not read with hierarchy intact in gray, more color will not fix it. Color is a signal (see [Color semantics](rules-visual-system.md#color-semantics)), never decoration.
- **Muted, not neon.** Saturated fills belong to small, deliberate accents (a selected control, a single badge), never to large surfaces or whole rows.
- **Spacing is a system, not a guess.** Every gap comes from the theme scale or the documented intra-cell px steps; nothing is a one-off number.
- **Density comes from smaller defaults, not from cramming.** Prefer the smaller control tier, the tighter line, the compact radius — then give elements enough breathing room to separate. Small _and_ legible, never small _and_ colliding.
- **Design the empty, loading, and error states as first-class — a real tool spends most of its time not on the happy path.**

## App shell

- **The navbar is brand-anchored, not theme-reactive.** `AppShell.Navbar` uses `bg="teal.9"` with `withBorder={false}` in both color schemes. Navigation is the stable frame around changing data; it must stay recognizable when the page theme flips. Do not "fix" it to a light/dark surface token.
- **The header is a thin strip for global controls only** (auth, color scheme, locale, global search when it exists). Page-level features never move into the shell — every pixel of chrome is a pixel the data cannot use.
- **Geometry comes from the theme.** Radius, spacing, and control sizes come from `packages/ui/theme/theme.ts` exclusively. Never introduce a local radius value or a pill-shaped card: compact corners signal a working tool; large rounding signals consumer software.

## Designing a new view

Work through these steps in order, before choosing any component.

**1. Write the decision sentence.** "After using this view, a user can decide ___." If the sentence is unclear, the feature has too much scope or needs discovery — stop and resolve that first. An "Audience" tab answers "who is this subject reaching and where?", not "every audience field the API returns."

**2. Pick the primary comparison unit.**

| The user compares…                           | Start with…                                       |
| -------------------------------------------- | ------------------------------------------------- |
| Many named entities across the same measures | A table                                           |
| A change across time                         | A chart, with the current value placed next to it |
| A quick status before deciding where to dig  | A small group of KPI cards                        |

Cards are not dashboard decoration: each card must answer a _different_ decision-relevant question. Two cards restating the same signal in different words get combined or removed.

**3. Build the reading order.** One scan path, top to bottom:

1. **Orientation** — title, time period, the one or two facts that establish context.
2. **Decision signals** — the compact summary values or the main chart/table answering the view's question.
3. **Evidence** — the rows, segments, or drill-downs the user needs to trust or challenge the summary.
4. **Action** — shortlist, compare, export — only when it directly follows from the analysis.

This ordering is why a dense screen still feels calm; it prevents the "dashboard of unrelated cards" failure where every metric shouts at the same level.

**4. Run the decision sequence.**

| Question                                        | Design consequence                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| What is the user trying to decide?              | Make the corresponding measure, comparison, or action prominent.                    |
| What is the smallest useful default view?       | Show the common case first; hide advanced controls until needed.                    |
| What needs side-by-side comparison?             | Aligned columns, shared axes, tabular numerals — not separate cards.                |
| What can change the answer?                     | Make that dimension a filter, a sort, or a visible period selector.                 |
| What happens when data is absent or late?       | Design loading, empty, error, and partial states before polishing the loaded state. |
| What must stay visible while inspecting detail? | Preserve identity, scope, and key context via headings or sticky columns.           |

The user must never have to infer whether a value is current, filtered, estimated, or unavailable. Prefer a compact label, period selector, or inline "not available" over a blank that looks accidentally unfinished.

**Profile and detail pages** are for analysis, not showcase: a compact identity header (small avatar, metadata, platform links) with views available immediately — never a cover-image hero that delays the data. Keep the full set of views visible on desktop; on narrow screens translate the _same_ set into a horizontally scrollable bar. One information architecture, responsively rendered.

**Completion checklist** — walk the view as an analyst before calling it done:

1. Can I state the decision this view helps me make in one sentence?
2. Can I understand the default view without opening a filter or tooltip?
3. Does every KPI, chart, and control change understanding or action?
4. Does the first viewport work for its living — no decorative hero, no permanently empty control strip?
5. Are loading, error, empty, partial-data, and narrow-screen states truthful and usable?
6. Can I share the filtered/sorted view and return to the same position later?
7. Does every text/background pair meet the contrast floor in both color schemes? (see [Accessibility and contrast](rules-visual-system.md#accessibility-and-contrast))

If any answer is no, simplify before adding visual treatment. A feature earns polish by making research faster and more reliable, not by accumulating decoration.

## Data states

Design the state model before polishing the happy path. Every view distinguishes four states, in this order:

```tsx
if (query.isPending) return <ViewSkeleton />; // mirrors the final geometry — no jump on arrival
if (query.isError) return <ErrorAlert onRetry={query.refetch} />;
if (rows.length === 0) return <EmptyState title="..." description="..." />;
return <DataView rows={rows} />;
```

- **A request failure is not an empty result.** An empty table caused by a timeout is indistinguishable from "no records" unless the error state is visually distinct and says what failed with a concrete recovery action (Mantine `<Alert color="red">` with a retry). Silent failure is never acceptable in an analytical product.
- **A valid empty result guides the next step** ("No results for this selection — try another period or remove a filter"), it does not dead-end.
- **Partial coverage is labeled, not hidden.** When one platform or metric is missing, show the known values and mark the gap inline; never hide the section or substitute zero.

Table-specific mechanics (skeleton structure, refetch rows, bar heights) are specified in [Table loading states](rules-components.md#table-loading-states).

## Filters, controls, and layout

- Every control must answer: **"what decision does changing this affect?"** A control that changes interpretation (time period, market, level) earns visible placement near the evidence it affects. Cosmetic or rarely-used options collapse behind a compact trigger showing a truthful active-filter count — they do not get permanent screen real estate.
- **Changing filters or sort resets pagination to page 1.** Never leave the user on an orphaned page of a result set that no longer exists.
- **State that changes what a colleague would see belongs in the URL** — filters, sort, page, period — so any important view is shareable and reproducible.

### Control placement

Place controls by a decision procedure, not fixed positions — the right layout depends on how many filters a view has.

1. **Group by target.** Everything that filters the table lives together in the page header, near the table it acts on. Search that filters the table sits with those filters — never floating detached in a page corner.
2. **Split by frequency.** Common, interpretation-changing filters render inline; cosmetic or rarely-used ones collapse behind a single trigger showing a truthful active-filter count.
3. **Place by role, and let it wrap.** Primary filters and inline search fill from the left; utility controls (column picker, density, export, saved views) cluster on the right — **on the title/count row**, sharing it. The header is one flex row that wraps to a balanced second row when filters overflow.

**No control gets a row to itself.** A control row is justified full-width with no control isolated in an otherwise-empty band. A lone utility control (a column picker, an export button) joins the title/count row or the filter row — it never earns its own strip with empty space beside it. When filters exceed one row, wrap to a balanced second row grouped by target; never leave one edge populated and the rest empty. **Test:** no toolbar row is more than ~60% empty.

**Header composition.** One header row owns the page's controls: title + live count, inline search, then quick-filter pill groups — in that order — with utility controls right-aligned on the same row. It wraps to a balanced second row when it must, never to a lopsided strip. **Concrete acceptance:** at a 1512px viewport, one header row holds title + count + search + every primary pill group + the sort control with margin and the utility cluster right-aligned; nothing wraps, including the header labels themselves (inline `nowrap`). Below that width it wraps gracefully by group.

**Default sort is the page's ranking metric,** not the alphabet — which also sinks empty rows to the bottom.

## Pagination

Explicit server-side pagination with a fixed page size — never infinite scroll. Rosters run to tens of thousands of entities; infinite scroll accumulates DOM nodes, degrades sorting and filtering over time, and destroys "return to where I was." Explicit pages bound memory, put the position in the URL, and give the user a reliable anchor. Do not trade those properties for apparent smoothness.

## Charts and motion

- **Charts use `@mantine/charts`** (Recharts under Mantine theming). Series colors are Mantine color tokens with the semantic meanings from [Color semantics](rules-visual-system.md#color-semantics), so every chart follows the active color scheme — never per-chart hardcoded hex.
- A chart's job is the trend; **place the current value beside the chart** rather than making the user read it off an axis.
- If a visualization needs a primitive `@mantine/charts` does not own (e.g. geographic maps), propose the smallest library that owns it — per the root technology-choices rule — rather than forcing the wrong tool or hand-rolling.
- **No JavaScript animation library on data pages.** These regions re-render on every query response, filter change, and sort toggle — exactly when JS-driven motion janks. Feedback is short CSS transitions (~150ms, colors/transform). Never animate a region that re-renders with data.

## Performance is part of the design

Server-side pagination for large lists; debounce type-ahead filters (`useDebouncedValue`); don't render off-screen rows speculatively. A view is not complete if it is polished at 20 rows and slow or unstable at realistic scale.

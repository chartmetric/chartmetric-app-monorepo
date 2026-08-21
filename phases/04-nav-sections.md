# Phase 04 — Left-nav sections for the sports vertical

## Goal

The app shell's left nav gains labeled sections so the sports vertical
can group its pages: Library (things you track) and Discover (catalog
browsing), plus Tools, matching the product mock in the PRD entry
"Leagues list (sports vertical)". Not-yet-built destinations from the
mock (Dashboard, Teams, Games, Events, Shortlists, Compare) ship as
disabled items — user-confirmed. At the end of this phase the sports
nav shows the mock's structure with Athletes under Library, and the
section mechanism is generic enough that phase 05 adds the Leagues
item with one declaration line.

## Acceptance

- `VerticalNavLink` in `apps/web/src/verticals.ts` supports optional
  `section` (`'library' | 'discover' | 'tools'`) and `disabled`
  fields; the sports vertical declares: Dashboard (top-level,
  disabled), Library → Athletes, Discover → Teams, Games, Events (all
  disabled), Tools → Shortlists, Compare (both disabled); music and
  creators `navLinks` are unchanged and flat.
- `Layout.tsx` renders localized section headers (LIBRARY, DISCOVER,
  TOOLS) above their grouped links; unsectioned links render above the
  first section without a header; a vertical with no sectioned links
  renders exactly as today.
- Disabled nav items do not navigate, carry `aria-disabled`, and are
  visually muted; enabled items keep the existing active/hover
  behavior.
- Every sports nav item renders a FontAwesome icon imported by
  individual path; no Unicode symbols.
- All new user-facing strings go through Lingui and are translated in
  all 7 locales in the common catalog; `lingui compile --strict`
  passes via the repo checks.
- Tests under `apps/web/src/layout` cover section grouping, disabled
  item non-navigation and `aria-disabled`, and flat rendering for
  verticals without sections; `pnpm typecheck`, `pnpm test`, and
  `pnpm build` pass.

## In scope

- `apps/web/src/verticals.ts` (nav declaration shape + sports entries)
- `apps/web/src/layout/**` (Layout rendering, its CSS module, new
  tests)
- `apps/web/src/locales/common/**` (extracted + translated strings)

## Out of scope

- The Leagues nav item and `/sports/leagues` route — phase 05.
- Any page content, any `apps/api` change.
- Adding sections to music or creators navs.
- Growing the documented VerticalConfig contract (hostnames, branding,
  terminology) — nav declarations live in `verticals.ts` as app code,
  not in that contract.
- Route-level permission metadata — nothing here is restricted
  (ADR-001).

## Notes / open questions

- PRD: `docs/PRD.md` → "## Leagues list (sports vertical)",
  requirement 7 and the mock description. Read the Resolved decisions.
- Design language applies (`docs/design/DESIGN_LANGUAGE.md` +
  `apps/web/AGENTS.md` "Design language"): FA icons by individual path
  import; section headers are secondary text (dimmed is correct here —
  headers are not filterable values); keep the navbar teal.9 identity.
- Mantine `NavLink` already accepts `leftSection` and `disabled` —
  prefer its props over custom CSS where they suffice.
- Section labels are user-facing (LIBRARY/DISCOVER/TOOLS as displayed
  text) — they must be `msg`-tagged like the existing nav labels so
  they land in the common catalog.
- Disabled presentation (tooltip "Coming soon" vs plain muted) is the
  writer's judgment within the design language; test behavior
  (non-navigation, aria) not pixels.
- Responsive rule from `apps/web/AGENTS.md`: verify at a width below
  the AppShell breakpoint; the burger/close-on-navigate behavior must
  survive.

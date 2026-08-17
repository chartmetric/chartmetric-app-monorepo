# Phase 01 — Athletes page design overhaul

## Goal

The athletes list page has several concrete design gaps: the `isFetching` prop is wired into `AthletesTable` but never rendered (missing LoadingOverlay); `LevelCell` uses `color="gray"` for professional athletes, which reads as inactive or absent in Mantine's semantic color system; `MomentumCell` uses raw Unicode characters instead of FontAwesome icons; the athlete identity cell stacks three lines when two would suffice; and the page header conflates editorial content with an operational control (the column picker). This phase closes all of them using Mantine's existing style system — no new component library, no new packages/ui exports.

Documentation (DESIGN_LANGUAGE.md, AGENTS.md section, skill update) ships in Phase 02, which depends on this phase.

## Acceptance

- AthletesTable renders a LoadingOverlay with overlayProps blur:1 while isFetching is true
- AthletesTable uses Paper shadow='sm' without withBorder
- LevelCell renders professional athletes with color='teal'
- MomentumCell uses FontAwesome faArrowUp/faArrowDown/faMinus icons instead of Unicode characters
- AthleteListLoading renders five Skeleton rows in a Stack instead of a centered Loader
- AthleteIdentity renders a round avatar with a border ring and sport as a Badge variant='dot'
- AthletesPage renders a named AthletesHeader sub-component and a controls row containing AthleteColumnPicker between filters and the table
- Component tests exist for AthletesTable, AthleteIdentity, and AthleteListLoading covering the above criteria

## In scope

- `apps/web/src/pages/sports/athletes/AthletesPage.tsx`
- `apps/web/src/pages/sports/athletes/components/AthletesTable.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/AthleteIdentity.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/LevelCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteCells/MomentumCell.tsx`
- `apps/web/src/pages/sports/athletes/components/AthleteListStates/AthleteListLoading.tsx`
- Test files co-located alongside each changed component (`*.test.tsx`)

## Out of scope

- Do NOT touch `apps/web/src/pages/music/artists/` — artist-page work is a separate phase.
- Do NOT change any API module, query builder, filter options, or column definitions.
- Do NOT install a new component library or create a new styling system. Use Mantine props, variants, style props (`bd`, `shadow`, `radius`, `c`), and `@fortawesome/pro-solid-svg-icons` (already installed).
- Do NOT create new exports in `packages/ui` — all work stays inside `apps/web/src/pages/sports/athletes/`.
- Do NOT add a permission check. A redesigned page requires no new permission (`docs/architecture/access-and-feature-gating.md` §5).
- Do NOT touch `AthleteColumnPicker`'s internal logic — only its placement in `AthletesPage.tsx` changes.
- Do NOT write `docs/design/DESIGN_LANGUAGE.md` or update `AGENTS.md` or the skill — that is Phase 02.

## Notes / open questions

**Skills to read before starting:**
- `apps/web/AGENTS.md` (layout rules, responsive rules, completion checklist)
- `.agents/skills/frontend-feature-workflow/SKILL.md` (mandatory shared-component audit)
- `.agents/skills/comment-discipline/SKILL.md` (no-unnecessary-comments policy)
- `.agents/skills/lingui-best-practices/SKILL.md` (i18n — any new user-visible string needs Lingui)

**Implementation details:**

LoadingOverlay:
```tsx
// In AthletesTable, wrap DataTable in:
<Box pos="relative">
  <LoadingOverlay
    loaderProps={{ "aria-label": t`Updating athletes` }}
    overlayProps={{ blur: 1 }}
    visible={isFetching}
    zIndex={2}
  />
  <DataTable … />
</Box>
```

Paper surface:
```tsx
// Replace:
<Paper radius="md" withBorder>
// With:
<Paper radius="md" shadow="sm">
```

LevelCell: `color="gray"` → `color="teal"` for professional. College stays `color="blue"`.

MomentumCell — replace Unicode with FA icons:
```tsx
import { faArrowDown } from "@fortawesome/pro-solid-svg-icons/faArrowDown";
import { faArrowUp } from "@fortawesome/pro-solid-svg-icons/faArrowUp";
import { faMinus } from "@fortawesome/pro-solid-svg-icons/faMinus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const MOMENTUM_ICONS = {
  cold: faArrowDown,
  hot: faArrowUp,
  steady: faMinus,
} as const;

// Render: <FontAwesomeIcon aria-hidden="true" icon={MOMENTUM_ICONS[trend]} />
```

AthleteIdentity — two-line layout:
```tsx
<Avatar
  alt={athlete.name}
  bd="1px solid var(--mantine-color-default-border)"
  name={athlete.name}
  radius="xl"
  size={40}
  src={athlete.imageUrl}
/>
<div>
  {/* Line 1: name + verified badge */}
  <Group align="center" gap={4} wrap="nowrap">
    <Text fw={600} size="sm">{athlete.name}</Text>
    {athlete.isVerified ? <FontAwesomeIcon … /> : null}
  </Group>
  {/* Line 2: flag + sport badge */}
  <Group gap={4} wrap="nowrap">
    <CountryFlag countryCode={athlete.countryCode} />
    <Badge color="gray" size="xs" variant="dot">
      {/* sport label — must go through Lingui */}
    </Badge>
  </Group>
</div>
```

Social links: add `gap={4}` to the wrapping Group; set icon size `xs`.

AthleteListLoading — Skeleton rows:
```tsx
import { Skeleton, Stack } from "@mantine/core";

// Replace centered Loader with:
<Stack gap={1}>
  {Array.from({ length: 5 }).map((_, i) => (
    <Skeleton animate height={48} key={i} radius="sm" />
  ))}
</Stack>
```

AthletesPage restructure:
```tsx
// Private sub-component (not exported):
const AthletesHeader: FC = () => (
  <div>
    <Title order={1}><Trans>Athletes</Trans></Title>
    <Text c="dimmed" mt={4}><Trans>Explore athletes across sports.</Trans></Text>
  </div>
);

// Main render — Stack layout:
<Stack gap="lg">
  <AthletesHeader />
  <AthleteFilters … />
  <Group justify="flex-end">       {/* controls row */}
    <AthleteColumnPicker … />
  </Group>
  <AthleteListContent … />
</Stack>
```

Row count: move existing text into a `<Group justify="space-between">` alongside the `<TablePagination>` component, or pass it as a prop to the footer row — examine the current structure and choose the minimal change.

**i18n invariant:** Every new user-visible string must be wrapped in `<Trans>` or `t\`\`` (ARCHITECTURE.md). Badge labels for sport, trend labels, and the skeleton's aria context (if any) are user-visible.

**Tests:** Write tests first — the runner refuses to start a phase whose `verification_cmd` already passes. Use `@testing-library/react` (already installed). Tests live co-located alongside components. Cover: LoadingOverlay visibility, Paper shadow prop, teal/blue badge colors, FA icons present, Skeleton count, AthleteIdentity two-line structure, AthletesPage layout order.

**ADR-006:** `AthletesHeader` is a private sub-component of `AthletesPage.tsx` — do not export it, do not move it to `packages/ui`.

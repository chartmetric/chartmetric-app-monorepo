import type { FC, ReactNode } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Divider, Group, Text } from "@mantine/core";

import type { AthleteLevel } from "../api/types";
import type { AthleteFilterDraft, FollowerRange } from "../filters/types";

// Buckets mirror the upstream dashboard's audience-size pills.
const FOLLOWER_PRESETS: readonly FollowerRange[] = [
  { max: null, min: 100_000_000 },
  { max: null, min: 10_000_000 },
  { max: null, min: 1_000_000 },
  { max: 1_000_000, min: null },
];

interface PillGroupProps {
  children: ReactNode;
  label: string;
}

const PillGroup: FC<PillGroupProps> = ({ children, label }) => (
  <Group gap={4} wrap="nowrap">
    <Text c="dimmed" size="xs" tt="uppercase">
      {label}
    </Text>
    {children}
  </Group>
);

interface PillProps {
  isActive: boolean;
  label: string;
  onToggle: () => void;
}

const Pill: FC<PillProps> = ({ isActive, label, onToggle }) => (
  <Button
    aria-pressed={isActive}
    onClick={onToggle}
    size="compact-xs"
    variant={isActive ? "filled" : "default"}
  >
    {label}
  </Button>
);

interface LevelPillsProps {
  levels: readonly AthleteLevel[];
  onChange: (levels: readonly AthleteLevel[]) => void;
}

const LevelPills: FC<LevelPillsProps> = ({ levels, onChange }) => {
  const { t } = useLingui();
  const options: readonly { label: string; value: AthleteLevel }[] = [
    { label: t`College`, value: "college" },
    { label: t`Pro`, value: "professional" },
  ];

  return (
    <PillGroup label={t`Level`}>
      {options.map(({ label, value }) => {
        const isActive = levels.includes(value);

        return (
          <Pill
            isActive={isActive}
            key={value}
            label={label}
            onToggle={() => {
              onChange(
                isActive
                  ? levels.filter((level) => level !== value)
                  : [...levels, value],
              );
            }}
          />
        );
      })}
    </PillGroup>
  );
};

interface FollowerPillsProps {
  compactFormatter: Intl.NumberFormat;
  onChange: (followers: FollowerRange) => void;
  value: FollowerRange;
}

const FollowerPills: FC<FollowerPillsProps> = ({
  compactFormatter,
  onChange,
  value,
}) => {
  const { t } = useLingui();
  const presetLabel = (range: FollowerRange): string => {
    if (range.min === null) {
      const threshold = compactFormatter.format(range.max ?? 0);

      return t({
        comment: "Audience-size filter for accounts below a threshold",
        message: `<${threshold}`,
      });
    }

    const threshold = compactFormatter.format(range.min);

    return t({
      comment: "Audience-size filter for accounts above a threshold",
      message: `${threshold}+`,
    });
  };

  return (
    <PillGroup label={t`Instagram`}>
      {FOLLOWER_PRESETS.map((preset) => {
        const isActive = value.min === preset.min && value.max === preset.max;

        return (
          <Pill
            isActive={isActive}
            key={presetLabel(preset)}
            label={presetLabel(preset)}
            onToggle={() => {
              onChange(isActive ? { max: null, min: null } : { ...preset });
            }}
          />
        );
      })}
    </PillGroup>
  );
};

export interface AthleteQuickFiltersProps {
  compactFormatter: Intl.NumberFormat;
  draft: AthleteFilterDraft;
  onFollowersChange: (followers: FollowerRange) => void;
  onLevelsChange: (levels: readonly AthleteLevel[]) => void;
  onVerifiedChange: (isVerified: boolean) => void;
}

export const AthleteQuickFilters: FC<AthleteQuickFiltersProps> = ({
  compactFormatter,
  draft,
  onFollowersChange,
  onLevelsChange,
  onVerifiedChange,
}) => (
  <>
    <LevelPills levels={draft.levels} onChange={onLevelsChange} />
    <Divider orientation="vertical" />
    <FollowerPills
      compactFormatter={compactFormatter}
      onChange={onFollowersChange}
      value={draft.followers}
    />
    <Divider orientation="vertical" />
    <Button
      aria-pressed={draft.isVerified}
      onClick={() => {
        onVerifiedChange(!draft.isVerified);
      }}
      size="compact-xs"
      variant={draft.isVerified ? "filled" : "default"}
    >
      <Trans comment="Filter limiting the list to verified accounts">
        Verified
      </Trans>
    </Button>
  </>
);

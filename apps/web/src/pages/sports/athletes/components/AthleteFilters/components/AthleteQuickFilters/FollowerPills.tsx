import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";

import type { FollowerRange } from "../../../../filters/types";

import { Pill } from "../../../../../quick-filter-pills/Pill";
import { PillGroup } from "../../../../../quick-filter-pills/PillGroup";

const FOLLOWER_PRESETS: readonly FollowerRange[] = [
  { max: null, min: 100_000_000 },
  { max: null, min: 10_000_000 },
  { max: null, min: 1_000_000 },
  { max: 1_000_000, min: null },
];

interface FollowerPillsProps {
  compactFormatter: Intl.NumberFormat;
  onChange: (followers: FollowerRange) => void;
  value: FollowerRange;
}

export const FollowerPills: FC<FollowerPillsProps> = ({
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

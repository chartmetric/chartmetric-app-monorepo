import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";

import type { AthleteLevel } from "../../../../api/types";

import { Pill } from "../../../../../quick-filter-pills/Pill";
import { PillGroup } from "../../../../../quick-filter-pills/PillGroup";

interface LevelPillsProps {
  levels: readonly AthleteLevel[];
  onChange: (levels: readonly AthleteLevel[]) => void;
}

export const LevelPills: FC<LevelPillsProps> = ({ levels, onChange }) => {
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

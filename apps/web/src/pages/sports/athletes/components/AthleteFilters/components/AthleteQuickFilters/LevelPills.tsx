import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Pill } from "@repo/ui/pill";
import { PillGroup } from "@repo/ui/pill-group";

import type { AthleteLevel } from "../../../../api/types";

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

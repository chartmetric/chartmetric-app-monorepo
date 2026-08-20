import type { ReactNode } from "react";

import { Pill } from "../../../../quick-filter-pills/Pill";
import { PillGroup } from "../../../../quick-filter-pills/PillGroup";

export interface PillOption<Value extends number | string> {
  label: string;
  value: Value;
}

interface SingleSelectPillsProps<Value extends number | string> {
  /** Label of a leading pill that clears the group; omitted when absent. */
  clearLabel?: string;
  groupLabel: string;
  labelHidden?: boolean;
  onChange: (value: Value | null) => void;
  options: readonly PillOption<Value>[];
  value: Value | null;
}

export const SingleSelectPills = <Value extends number | string>({
  clearLabel,
  groupLabel,
  labelHidden,
  onChange,
  options,
  value,
}: SingleSelectPillsProps<Value>): ReactNode => (
  // Wrapping, unlike the athletes groups: the sport group is as long as the
  // catalog of sports, which would otherwise run off a phone-width viewport.
  <PillGroup
    label={groupLabel}
    {...(labelHidden === true && { labelHidden })}
    wrap="wrap"
  >
    {clearLabel === undefined ? null : (
      <Pill
        isActive={value === null}
        label={clearLabel}
        onToggle={() => {
          onChange(null);
        }}
      />
    )}
    {options.map((option) => {
      const isActive = option.value === value;

      return (
        <Pill
          isActive={isActive}
          key={option.value}
          label={option.label}
          onToggle={() => {
            onChange(isActive ? null : option.value);
          }}
        />
      );
    })}
  </PillGroup>
);

import type { FC } from "react";

import {
  Button,
  Group,
  NumberInput,
  Popover,
  RangeSlider,
  Stack,
  Text,
} from "@mantine/core";

export type NumericRangeValue = readonly [number | null, number | null];

export interface RangeFilterProps {
  clearLabel: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  label: string;
  max?: number;
  maximumLabel: string;
  min?: number;
  minimumLabel: string;
  onChange: (value: NumericRangeValue) => void;
  onChangeEnd?: (value: NumericRangeValue) => void;
  step?: number;
  value: NumericRangeValue;
}

const toNumberOrNull = (value: number | string | undefined): number | null =>
  typeof value === "number" ? value : null;

const toBoundProps = (bounds: {
  max: number | undefined;
  min: number | undefined;
}): { max?: number; min?: number } => ({
  ...(bounds.max !== undefined && { max: bounds.max }),
  ...(bounds.min !== undefined && { min: bounds.min }),
});

interface RangeInputsProps {
  max: number | undefined;
  maximumLabel: string;
  min: number | undefined;
  minimumLabel: string;
  onChange: (value: NumericRangeValue) => void;
  onChangeEnd: ((value: NumericRangeValue) => void) | undefined;
  step: number;
  value: NumericRangeValue;
}

const RangeInputs: FC<RangeInputsProps> = ({
  max,
  maximumLabel,
  min,
  minimumLabel,
  onChange,
  onChangeEnd,
  step,
  value,
}) => (
  <Group grow>
    <NumberInput
      {...toBoundProps({ max: value[1] ?? max, min })}
      aria-label={minimumLabel}
      clampBehavior="strict"
      onChange={(nextValue) => {
        const range: NumericRangeValue = [toNumberOrNull(nextValue), value[1]];

        onChange(range);
        onChangeEnd?.(range);
      }}
      step={step}
      value={value[0] ?? ""}
    />
    <NumberInput
      {...toBoundProps({ max, min: value[0] ?? min })}
      aria-label={maximumLabel}
      clampBehavior="strict"
      onChange={(nextValue) => {
        const range: NumericRangeValue = [value[0], toNumberOrNull(nextValue)];

        onChange(range);
        onChangeEnd?.(range);
      }}
      step={step}
      value={value[1] ?? ""}
    />
  </Group>
);

export const RangeFilter: FC<RangeFilterProps> = ({
  clearLabel,
  disabled = false,
  formatValue = String,
  label,
  max,
  maximumLabel,
  min,
  minimumLabel,
  onChange,
  onChangeEnd,
  step = 1,
  value,
}) => {
  const lowerBound = value[0] ?? min;
  const upperBound = value[1] ?? max;
  const hasValue = value[0] !== null || value[1] !== null;
  const rangeLabel = `${lowerBound === undefined ? "" : formatValue(lowerBound)}–${upperBound === undefined ? "" : formatValue(upperBound)}`;

  return (
    <Popover position="bottom-start" shadow="md" width={360} withArrow>
      <Popover.Target>
        <Button
          aria-label={label}
          disabled={disabled}
          type="button"
          variant={hasValue ? "light" : "default"}
        >
          <Group gap="xs" wrap="nowrap">
            <span>{label}</span>
            {hasValue ? (
              <Text c="dimmed" component="span" size="xs">
                {rangeLabel}
              </Text>
            ) : null}
          </Group>
        </Button>
      </Popover.Target>
      <Popover.Dropdown maw="calc(100vw - var(--mantine-spacing-md) * 2)">
        <Stack gap="lg">
          {min !== undefined && max !== undefined ? (
            <RangeSlider
              label={formatValue}
              max={max}
              min={min}
              onChange={(nextValue) => {
                onChange(nextValue);
              }}
              onChangeEnd={(nextValue) => {
                onChangeEnd?.(nextValue);
              }}
              step={step}
              value={[value[0] ?? min, value[1] ?? max]}
            />
          ) : null}
          <RangeInputs
            max={max}
            maximumLabel={maximumLabel}
            min={min}
            minimumLabel={minimumLabel}
            onChange={onChange}
            onChangeEnd={onChangeEnd}
            step={step}
            value={[lowerBound ?? null, upperBound ?? null]}
          />
          <Button
            onClick={() => {
              onChange([null, null]);
              onChangeEnd?.([null, null]);
            }}
            type="button"
            variant="subtle"
          >
            {clearLabel}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

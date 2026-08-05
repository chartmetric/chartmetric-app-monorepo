import type { FC } from "react";

import { Stack, Text } from "@mantine/core";

import { ColumnRow } from "./ColumnRow";
import {
  type ColumnPickerLabels,
  type ColumnPickerOption,
  moveKey,
} from "./types";

export interface ColumnListsProps {
  hiddenOptions: readonly ColumnPickerOption[];
  labels: ColumnPickerLabels;
  onChange: (keys: string[]) => void;
  onToggle: (key: string) => void;
  value: readonly string[];
  visibleOptions: readonly ColumnPickerOption[];
}

export const ColumnLists: FC<ColumnListsProps> = ({
  hiddenOptions,
  labels,
  onChange,
  onToggle,
  value,
  visibleOptions,
}) => (
  <Stack gap="md">
    <Stack gap={4}>
      <Text c="dimmed" size="xs" tt="uppercase">
        {labels.visibleSection}
      </Text>
      {visibleOptions.map((option, index) => (
        <ColumnRow
          group={option.group}
          isVisible
          key={option.key}
          label={option.label}
          onToggle={() => {
            onToggle(option.key);
          }}
          reorder={{
            canMoveDown: index < visibleOptions.length - 1,
            canMoveUp: index > 0,
            moveDownLabel: labels.moveDown(option.label),
            moveUpLabel: labels.moveUp(option.label),
            onMoveDown: () => {
              onChange(moveKey(value, index, index + 1));
            },
            onMoveUp: () => {
              onChange(moveKey(value, index, index - 1));
            },
          }}
        />
      ))}
    </Stack>
    {hiddenOptions.length === 0 ? null : (
      <Stack gap={4}>
        <Text c="dimmed" size="xs" tt="uppercase">
          {labels.hiddenSection}
        </Text>
        {hiddenOptions.map((option) => (
          <ColumnRow
            group={option.group}
            isVisible={false}
            key={option.key}
            label={option.label}
            onToggle={() => {
              onToggle(option.key);
            }}
          />
        ))}
      </Stack>
    )}
  </Stack>
);

export interface ColumnSearchResultsProps {
  emptyMessage: string;
  onToggle: (key: string) => void;
  results: readonly ColumnPickerOption[];
  value: readonly string[];
}

export const ColumnSearchResults: FC<ColumnSearchResultsProps> = ({
  emptyMessage,
  onToggle,
  results,
  value,
}) =>
  results.length === 0 ? (
    <Text c="dimmed" size="sm">
      {emptyMessage}
    </Text>
  ) : (
    <Stack gap={4}>
      {results.map((option) => (
        <ColumnRow
          group={option.group}
          isVisible={value.includes(option.key)}
          key={option.key}
          label={option.label}
          onToggle={() => {
            onToggle(option.key);
          }}
        />
      ))}
    </Stack>
  );

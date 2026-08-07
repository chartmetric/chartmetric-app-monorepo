import { Stack, Text } from "@mantine/core";
import { type FC, useState } from "react";

import type { ColumnPickerLabels, ColumnPickerOption } from "./types";

import { ColumnRow } from "./ColumnRow";
import { canMoveTo, moveKey } from "./ordering-utilities";

export interface ColumnListsProps {
  hiddenOptions: readonly ColumnPickerOption[];
  labels: ColumnPickerLabels;
  onChange: (keys: string[]) => void;
  onToggle: (key: string) => void;
  value: readonly string[];
  visibleOptions: readonly ColumnPickerOption[];
}

interface VisibleColumnsProps {
  labels: ColumnPickerLabels;
  onChange: (keys: string[]) => void;
  onToggle: (key: string) => void;
  options: readonly ColumnPickerOption[];
  value: readonly string[];
}

const VisibleColumns: FC<VisibleColumnsProps> = ({
  labels,
  onChange,
  onToggle,
  options,
  value,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const move = (from: number, to: number): void => {
    if (canMoveTo(options, from, to)) onChange(moveKey(value, from, to));
  };

  return (
    <Stack gap={4}>
      <Text c="dimmed" size="xs" tt="uppercase">
        {labels.visibleSection}
      </Text>
      {options.map((option, index) => (
        <ColumnRow
          drag={{
            handleLabel: labels.dragHandle(option.label),
            onDragEnd: () => {
              setDragIndex(null);
            },
            onDragOver: (event) => {
              // Without this the drop never fires; a locked row refuses it so
              // the browser keeps showing "not allowed".
              if (dragIndex !== null && option.locked !== true) {
                event.preventDefault();
              }
            },
            onDragStart: () => {
              setDragIndex(index);
            },
            onDrop: () => {
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            },
          }}
          group={option.group}
          isLocked={option.locked}
          isVisible
          key={option.key}
          label={option.label}
          onToggle={() => {
            onToggle(option.key);
          }}
          reorder={{
            canMoveDown: canMoveTo(options, index, index + 1),
            canMoveUp: canMoveTo(options, index, index - 1),
            moveDownLabel: labels.moveDown(option.label),
            moveUpLabel: labels.moveUp(option.label),
            onMoveDown: () => {
              move(index, index + 1);
            },
            onMoveUp: () => {
              move(index, index - 1);
            },
          }}
        />
      ))}
    </Stack>
  );
};

export const ColumnLists: FC<ColumnListsProps> = ({
  hiddenOptions,
  labels,
  onChange,
  onToggle,
  value,
  visibleOptions,
}) => (
  <Stack gap="md">
    <VisibleColumns
      labels={labels}
      onChange={onChange}
      onToggle={onToggle}
      options={visibleOptions}
      value={value}
    />
    {hiddenOptions.length === 0 ? null : (
      <Stack gap={4}>
        <Text c="dimmed" size="xs" tt="uppercase">
          {labels.hiddenSection}
        </Text>
        {hiddenOptions.map((option) => (
          <ColumnRow
            group={option.group}
            isLocked={option.locked}
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
          isLocked={option.locked}
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

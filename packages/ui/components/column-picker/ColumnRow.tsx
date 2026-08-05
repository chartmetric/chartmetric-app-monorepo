import type { FC } from "react";

import { ActionIcon, Badge, Checkbox, Group } from "@mantine/core";

export interface ColumnRowReorder {
  canMoveDown: boolean;
  canMoveUp: boolean;
  moveDownLabel: string;
  moveUpLabel: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

export interface ColumnRowProps {
  group: string | undefined;
  isVisible: boolean;
  label: string;
  onToggle: () => void;
  reorder?: ColumnRowReorder;
}

export const ColumnRow: FC<ColumnRowProps> = ({
  group,
  isVisible,
  label,
  onToggle,
  reorder,
}) => (
  <Group gap="xs" justify="space-between" wrap="nowrap">
    <Checkbox
      checked={isVisible}
      flex={1}
      label={label}
      onChange={onToggle}
      size="sm"
    />
    {group === undefined ? null : (
      <Badge color="gray" size="xs" variant="light">
        {group}
      </Badge>
    )}
    {reorder === undefined ? null : (
      <Group gap={2} wrap="nowrap">
        <ActionIcon
          aria-label={reorder.moveUpLabel}
          disabled={!reorder.canMoveUp}
          onClick={reorder.onMoveUp}
          size="sm"
          variant="subtle"
        >
          ↑
        </ActionIcon>
        <ActionIcon
          aria-label={reorder.moveDownLabel}
          disabled={!reorder.canMoveDown}
          onClick={reorder.onMoveDown}
          size="sm"
          variant="subtle"
        >
          ↓
        </ActionIcon>
      </Group>
    )}
  </Group>
);

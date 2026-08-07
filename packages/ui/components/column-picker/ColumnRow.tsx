import type { DragEvent, FC } from "react";

import {
  ActionIcon,
  Badge,
  Checkbox,
  Group,
  UnstyledButton,
} from "@mantine/core";

export interface ColumnRowDrag {
  handleLabel: string;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragStart: () => void;
  onDrop: () => void;
}

export interface ColumnRowReorder {
  canMoveDown: boolean;
  canMoveUp: boolean;
  moveDownLabel: string;
  moveUpLabel: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

export interface ColumnRowProps {
  drag?: ColumnRowDrag | undefined;
  group: string | undefined;
  isLocked?: boolean | undefined;
  isVisible: boolean;
  label: string;
  onToggle: () => void;
  reorder?: ColumnRowReorder | undefined;
}

export const ColumnRow: FC<ColumnRowProps> = ({
  drag,
  group,
  isLocked = false,
  isVisible,
  label,
  onToggle,
  reorder,
}) => (
  <Group
    gap="xs"
    justify="space-between"
    onDragOver={drag?.onDragOver}
    onDrop={drag?.onDrop}
    wrap="nowrap"
  >
    {drag === undefined || isLocked ? null : (
      <UnstyledButton
        aria-label={drag.handleLabel}
        draggable
        onDragEnd={drag.onDragEnd}
        onDragStart={drag.onDragStart}
        style={{ cursor: "grab" }}
      >
        <span aria-hidden="true">⠿</span>
      </UnstyledButton>
    )}
    <Checkbox
      checked={isVisible}
      disabled={isLocked}
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

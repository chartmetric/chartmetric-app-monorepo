import {
  Button,
  Checkbox,
  Group,
  Popover,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import { type FC, useState } from "react";

export interface ColumnPickerItem {
  key: string;
  label: string;
  locked?: boolean;
  visible: boolean;
}

export interface ColumnPickerProps {
  items: readonly ColumnPickerItem[];
  label: string;
  moveLabel: (columnLabel: string) => string;
  onChange: (items: ColumnPickerItem[]) => void;
}

const reorder = (
  items: readonly ColumnPickerItem[],
  from: number,
  to: number,
): ColumnPickerItem[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);

  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

interface ColumnPickerRowProps {
  index: number;
  isDragActive: boolean;
  item: ColumnPickerItem;
  moveLabel: (columnLabel: string) => string;
  onDragEnd: () => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onToggle: (key: string) => void;
}

const ColumnPickerRow: FC<ColumnPickerRowProps> = ({
  index,
  isDragActive,
  item,
  moveLabel,
  onDragEnd,
  onDragStart,
  onDrop,
  onMove,
  onToggle,
}) => (
  <Group
    component="li"
    gap="sm"
    onDragOver={(event) => {
      if (isDragActive && item.locked !== true) event.preventDefault();
    }}
    onDrop={() => {
      onDrop(index);
    }}
    wrap="nowrap"
  >
    {item.locked === true ? (
      <span aria-hidden="true" style={{ width: 16 }} />
    ) : (
      <UnstyledButton
        aria-label={moveLabel(item.label)}
        draggable
        onDragEnd={onDragEnd}
        onDragStart={() => {
          onDragStart(index);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onMove(index, index - 1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            onMove(index, index + 1);
          }
        }}
        style={{ cursor: "grab", width: 16 }}
      >
        <span aria-hidden="true">⠿</span>
      </UnstyledButton>
    )}
    <Checkbox
      checked={item.visible}
      disabled={item.locked === true}
      label={item.label}
      onChange={() => {
        onToggle(item.key);
      }}
    />
  </Group>
);

export const ColumnPicker: FC<ColumnPickerProps> = ({
  items,
  label,
  moveLabel,
  onChange,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const visibleCount = items.filter((item) => item.visible).length;

  const toggleVisibility = (key: string): void => {
    onChange(
      items.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const move = (from: number, to: number): void => {
    const target = items[to];

    if (from === to || target === undefined || target.locked === true) return;
    onChange(reorder(items, from, to));
  };

  const drop = (index: number): void => {
    if (dragIndex === null) return;

    move(dragIndex, index);
    setDragIndex(null);
  };

  return (
    <Popover position="bottom-end" shadow="md" width={280} withArrow>
      <Popover.Target>
        <Button type="button" variant="default">
          {`${label} (${String(visibleCount)})`}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack
          component="ul"
          gap="xs"
          m={0}
          p={0}
          style={{ listStyle: "none" }}
        >
          {items.map((item, index) => (
            <ColumnPickerRow
              index={index}
              isDragActive={dragIndex !== null}
              item={item}
              key={item.key}
              moveLabel={moveLabel}
              onDragEnd={() => {
                setDragIndex(null);
              }}
              onDragStart={setDragIndex}
              onDrop={drop}
              onMove={move}
              onToggle={toggleVisibility}
            />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

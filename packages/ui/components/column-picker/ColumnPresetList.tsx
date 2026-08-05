import type { FC } from "react";

import { ActionIcon, Button, Group, Stack, Text } from "@mantine/core";

import { type ColumnPickerPreset, isSamePreset } from "./types";

export interface ColumnPresetListProps {
  deleteLabel?: (name: string) => string;
  onApply: (keys: readonly string[]) => void;
  onDelete?: (name: string) => void;
  presets: readonly ColumnPickerPreset[];
  value: readonly string[];
}

export const ColumnPresetList: FC<ColumnPresetListProps> = ({
  deleteLabel,
  onApply,
  onDelete,
  presets,
  value,
}) => (
  <Stack gap={2}>
    {presets.map((preset) => {
      const isActive = isSamePreset(value, preset.keys);

      return (
        <Group gap="xs" key={preset.name} wrap="nowrap">
          <Button
            flex={1}
            justify="space-between"
            onClick={() => {
              onApply(preset.keys);
            }}
            rightSection={
              isActive ? (
                <Text aria-hidden="true" component="span">
                  ✓
                </Text>
              ) : null
            }
            size="compact-sm"
            variant={isActive ? "light" : "subtle"}
          >
            {preset.name}
          </Button>
          {onDelete === undefined || deleteLabel === undefined ? null : (
            <ActionIcon
              aria-label={deleteLabel(preset.name)}
              color="red"
              onClick={() => {
                onDelete(preset.name);
              }}
              size="sm"
              variant="subtle"
            >
              ✕
            </ActionIcon>
          )}
        </Group>
      );
    })}
  </Stack>
);

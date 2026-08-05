import {
  Badge,
  Button,
  Divider,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { type FC, useState } from "react";

import type { ColumnPickerLabels, ColumnPickerPreset } from "./types";

import { ColumnPresetList } from "./ColumnPresetList";

const POPOVER_WIDTH = 260;

interface MenuContentProps {
  customPresets: readonly ColumnPickerPreset[];
  labels: ColumnPickerLabels;
  onApplyPreset: (keys: readonly string[]) => void;
  onDeletePreset: ((name: string) => void) | undefined;
  onOpenConfigure: () => void;
  presets: readonly ColumnPickerPreset[];
  value: readonly string[];
}

const MenuContent: FC<MenuContentProps> = ({
  customPresets,
  labels,
  onApplyPreset,
  onDeletePreset,
  onOpenConfigure,
  presets,
  value,
}) => (
  <Stack gap="xs">
    <UnstyledButton onClick={onOpenConfigure}>
      <Text fw={600} size="sm">
        {labels.configureTitle}
      </Text>
      <Text c="dimmed" size="xs">
        {labels.configureDescription}
      </Text>
    </UnstyledButton>
    {presets.length === 0 && customPresets.length === 0 ? null : (
      <>
        <Divider />
        <Text c="dimmed" size="xs" tt="uppercase">
          {labels.presetsSection}
        </Text>
        <ColumnPresetList
          onApply={onApplyPreset}
          presets={presets}
          value={value}
        />
        {onDeletePreset === undefined || customPresets.length === 0 ? null : (
          <ColumnPresetList
            deleteLabel={labels.deleteGroup}
            onApply={onApplyPreset}
            onDelete={onDeletePreset}
            presets={customPresets}
            value={value}
          />
        )}
      </>
    )}
  </Stack>
);

export interface ColumnPickerMenuProps extends Omit<
  MenuContentProps,
  "onOpenConfigure"
> {
  onOpenConfigure: () => void;
}

export const ColumnPickerMenu: FC<ColumnPickerMenuProps> = ({
  onApplyPreset,
  onOpenConfigure,
  ...content
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      onChange={setIsOpen}
      opened={isOpen}
      position="bottom-end"
      shadow="md"
      width={POPOVER_WIDTH}
      withinPortal
    >
      <Popover.Target>
        <Button
          onClick={() => {
            setIsOpen((opened) => !opened);
          }}
          rightSection={
            <Badge circle size="sm" variant="filled">
              {content.value.length}
            </Badge>
          }
          variant="default"
        >
          {content.labels.trigger}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <MenuContent
          {...content}
          onApplyPreset={(keys) => {
            onApplyPreset(keys);
            setIsOpen(false);
          }}
          onOpenConfigure={() => {
            setIsOpen(false);
            onOpenConfigure();
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
};

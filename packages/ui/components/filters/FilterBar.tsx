import type { FC, ReactNode } from "react";

import { Button, Group, Paper, Stack } from "@mantine/core";

export interface FilterBarProps {
  children: ReactNode;
  clearLabel: string;
  label: string;
  onClear: () => void;
  /**
   * Rendered as its own row beneath `children`, however much space the row above
   * has left. Without it, controls placed in `children` wrap only once the row
   * fills, which splits a group at whatever point it happens to run out.
   */
  rowBelow?: ReactNode;
}

export const FilterBar: FC<FilterBarProps> = ({
  children,
  clearLabel,
  label,
  onClear,
  rowBelow,
}) => (
  <Paper aria-label={label} component="section" p="md" radius="md" withBorder>
    <Stack gap="sm">
      <Group align="flex-end" gap="sm">
        <Group align="flex-end" flex={1} gap="sm">
          {children}
        </Group>
        <Button onClick={onClear} type="button" variant="default">
          {clearLabel}
        </Button>
      </Group>
      {rowBelow === undefined ? null : (
        <Group align="center" gap="sm">
          {rowBelow}
        </Group>
      )}
    </Stack>
  </Paper>
);

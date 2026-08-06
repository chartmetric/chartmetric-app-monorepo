import type { FC, ReactNode } from "react";

import { Button, Group, Paper, Stack } from "@mantine/core";

export interface FilterBarProps {
  children: ReactNode;
  clearLabel: string;
  label: string;
  onClear: () => void;
  /**
   * Compact always-visible controls, kept together on their own row beneath
   * `children`. They need the separate row because `children` wraps only once it
   * fills, which would split the group at whatever point it ran out of space.
   */
  quickFilters?: ReactNode;
}

export const FilterBar: FC<FilterBarProps> = ({
  children,
  clearLabel,
  label,
  onClear,
  quickFilters,
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
      {quickFilters === undefined ? null : (
        <Group align="center" gap="sm">
          {quickFilters}
        </Group>
      )}
    </Stack>
  </Paper>
);

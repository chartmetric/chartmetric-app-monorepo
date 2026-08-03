import type { FC, ReactNode } from "react";

import { Button, Group, Paper } from "@mantine/core";

export interface FilterBarProps {
  children: ReactNode;
  clearLabel: string;
  label: string;
  onClear: () => void;
}

export const FilterBar: FC<FilterBarProps> = ({
  children,
  clearLabel,
  label,
  onClear,
}) => (
  <Paper aria-label={label} component="section" p="md" radius="md" withBorder>
    <Group align="flex-end" gap="sm">
      <Group align="flex-end" flex={1} gap="sm">
        {children}
      </Group>
      <Button onClick={onClear} type="button" variant="default">
        {clearLabel}
      </Button>
    </Group>
  </Paper>
);

import type { FC, ReactNode } from "react";

import { Group, Text } from "@mantine/core";

export const PillGroup: FC<{ children: ReactNode; label: string }> = ({
  children,
  label,
}) => (
  <Group gap={4} wrap="nowrap">
    <Text c="dimmed" size="xs" tt="uppercase">
      {label}
    </Text>
    {children}
  </Group>
);
